from rest_framework import serializers, viewsets, routers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.decorators import action
import os
import csv
import io
from django.http import HttpResponse

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False
from rest_framework.throttling import ScopedRateThrottle
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
import random
from datetime import date
from apps.obligations.models import Loan, Debt, EMIPayment
from apps.portfolio.models import Asset
from apps.finances.models import Category, Transaction, Budget, MarketingCampaign, Notification
from apps.utils.emails import send_verification_otp, send_reset_otp

# --- 1. Serializers (Convert DB -> JSON) ---
class LoanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = '__all__'
        read_only_fields = ['user']

class DebtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Debt
        fields = '__all__'
        read_only_fields = ['user']

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ['user']

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.type', read_only=True)
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'description', 'date', 'category', 'category_name', 'category_type', 'user']
        read_only_fields = ['user']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'user']
        read_only_fields = ['user']


class EMIPaymentSerializer(serializers.ModelSerializer):
    loan_name = serializers.CharField(source='loan.name', read_only=True)
    class Meta:
        model = EMIPayment
        fields = '__all__'

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = Budget
        fields = ['id', 'category', 'category_name', 'amount_limit', 'month', 'is_deleted', 'user']
        read_only_fields = ['user']



class MarketingCampaignSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MarketingCampaign
        fields = ['id', 'title', 'subtitle', 'content', 'image_url', 'cta_text', 'cta_link', 'start_date', 'end_date', 'is_active', 'target_filter']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user']


# --- Custom JWT Login Serializer & View ---
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Allow authenticating with Email as well as Username
        username_or_email = attrs.get('username')
        if username_or_email and '@' in username_or_email:
            try:
                user = User.objects.get(email=username_or_email)
                attrs['username'] = user.username
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        
        # Check if email is verified (superusers bypass this check)
        if not self.user.is_superuser and hasattr(self.user, 'profile') and not self.user.profile.is_verified:
            raise AuthenticationFailed("EMAIL_NOT_VERIFIED")
            
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'sensitive'


# --- 2. Auth API Views (Register, Verify, Forgot, Reset) ---
class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'sensitive'

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        device_token = request.data.get('device_token')
        device_type = request.data.get('device_type', 'Web')

        if not username or not email or not password:
            return Response({"error": "Username, email, and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = User.objects.create(
            username=username,
            email=email,
            password=make_password(password),
            first_name=first_name,
            last_name=last_name
        )

        # Generate 6-digit OTP code
        otp_code = str(random.randint(100000, 999999))
        user.profile.verification_code = otp_code
        user.profile.save()

        # Handle Device Token
        if device_token:
            from apps.finances.models import UserDevice
            UserDevice.objects.get_or_create(
                user=user,
                device_token=device_token,
                defaults={'device_type': device_type}
            )

        # Send OTP code via HTML email helper
        try:
            send_verification_otp(email, otp_code)
        except Exception as e:
            print(f"Failed to send verification email to {email}: {e}")

        return Response({
            "message": "User registered successfully. Please verify your email address.",
            "email": email
        }, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'sensitive'

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({"error": "Email and verification code are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.profile.verification_code == code:
                user.profile.is_verified = True
                user.profile.verification_code = None
                user.profile.save()
                return Response({"message": "Email verified successfully! You can now login."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'sensitive'

    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            reset_code = str(random.randint(100000, 999999))
            user.profile.reset_code = reset_code
            user.profile.save()

            # Send Reset OTP via HTML email helper
            try:
                send_reset_otp(email, reset_code)
            except Exception as e:
                print(f"Failed to send reset email to {email}: {e}")

            return Response({"message": "Password reset code sent successfully.", "email": email}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'sensitive'

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')

        if not email or not code or not new_password:
            return Response({"error": "Email, code, and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.profile.reset_code == code:
                user.password = make_password(new_password)
                user.profile.reset_code = None
                user.save()
                user.profile.save()
                return Response({"message": "Password reset successfully! You can now login."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid reset code."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)


# --- 3. ViewSets (Business Logic secured via User isolation) ---
class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DebtViewSet(viewsets.ModelViewSet):
    queryset = Debt.objects.all()
    serializer_class = DebtSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EMIPaymentViewSet(viewsets.ModelViewSet):
    queryset = EMIPayment.objects.all()
    serializer_class = EMIPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(loan__user=self.request.user, is_deleted=False)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)



class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user, is_deleted=False).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActiveMarketingCampaignView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        # Find active campaigns
        campaigns = MarketingCampaign.objects.filter(
            start_date__lte=today,
            end_date__ge=today,
            is_active=True
        )
        
        user = request.user
        matching_campaigns = []
        
        # Prefetch check indicators
        has_investments = Asset.objects.filter(user=user).exists()
        has_loans = Loan.objects.filter(user=user).exists()
        has_debts = Debt.objects.filter(user=user, debt_type='TAKEN').exists()
        is_debtor = has_loans or has_debts
        
        for campaign in campaigns:
            target = campaign.target_filter
            if target == 'ALL':
                matching_campaigns.append(campaign)
            elif target == 'NO_INVESTMENTS' and not has_investments:
                matching_campaigns.append(campaign)
            elif target == 'DEBTORS' and is_debtor:
                matching_campaigns.append(campaign)
                
        serializer = MarketingCampaignSerializer(matching_campaigns, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AIFinancialAuditView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        custom_prompt = request.data.get('prompt', '')

        # 1. Fetch Income and Expenses
        transactions = Transaction.objects.filter(user=user)
        income_total = 0.0
        expense_total = 0.0
        category_spending = {}

        for tx in transactions:
            amt = float(tx.amount)
            if tx.category:
                cat_type = tx.category.type
                cat_name = tx.category.name
                if cat_type == 'INCOME':
                    income_total += amt
                elif cat_type == 'EXPENSE':
                    expense_total += amt
                    category_spending[cat_name] = category_spending.get(cat_name, 0.0) + amt

        # 2. Fetch Budgets
        budgets = Budget.objects.filter(user=user)
        budget_details = []
        for b in budgets:
            cat_name = b.category.name if b.category else "Uncategorized"
            limit = float(b.amount_limit)
            spent = category_spending.get(cat_name, 0.0)
            percent = (spent / limit) * 100 if limit > 0 else 0
            budget_details.append({
                "category": cat_name,
                "limit": limit,
                "spent": spent,
                "percentage": round(percent, 2)
            })

        # 3. Fetch Obligations
        loans = Loan.objects.filter(user=user)
        loan_details = []
        for l in loans:
            loan_details.append({
                "name": l.name,
                "type": l.loan_type,
                "principal": float(l.total_principal),
                "emi": float(l.emi_amount)
            })

        debts = Debt.objects.filter(user=user)
        debt_details = []
        for d in debts:
            debt_details.append({
                "person": d.person_name,
                "type": d.debt_type,
                "amount": float(d.amount),
                "status": d.status,
                "due_date": str(d.due_date) if d.due_date else "None"
            })

        # 4. Fetch Assets / Investments
        assets = Asset.objects.filter(user=user)
        asset_details = []
        total_investments = 0.0
        for a in assets:
            val = float(a.quantity) * float(a.buy_price_avg)
            total_investments += val
            asset_details.append({
                "symbol": a.symbol,
                "name": a.name,
                "type": a.asset_type,
                "quantity": float(a.quantity),
                "avg_price": float(a.buy_price_avg),
                "valuation": val
            })

        # Format details into clean strings
        budget_str = "\n".join([f"- {b['category']}: Limit ₹{b['limit']}, Spent ₹{b['spent']} ({b['percentage']}%)" for b in budget_details])
        loan_str = "\n".join([f"- {l['name']} ({l['type']}): Principal ₹{l['principal']}, Monthly EMI ₹{l['emi']}" for l in loan_details])
        debt_str = "\n".join([f"- {d['person']} ({d['type']}): ₹{d['amount']}, Status: {d['status']}, Due: {d['due_date']}" for d in debt_details])
        asset_str = "\n".join([f"- {a['symbol']} ({a['name']}): Qty {a['quantity']}, Valued ₹{a['valuation']}" for a in asset_details])

        # Prepare context data
        context_prompt = f"""
You are MeraPaisa's elite, premium startup AI Financial Advisor.
Analyze the user's financial profile below gathered from their database:

### User Profile:
- Username: {user.username}
- Email: {user.email}

### Income & Expenses:
- Total Income recorded: ₹{income_total}
- Total Expenses recorded: ₹{expense_total}
- Net Balance: ₹{income_total - expense_total}

### Budgets Allocations & Spendings:
{budget_str if budget_str else "No active category budgets defined."}

### Outstanding Loans & EMIs:
{loan_str if loan_str else "No active bank loans logged."}

### Informal Debts (Borrowed/Lent):
{debt_str if debt_str else "No active informal debt records logged."}

### Investment Portfolio:
- Total Invested Valuation: ₹{total_investments}
{asset_str if asset_str else "No assets or holdings registered in the portfolio."}

User request: {custom_prompt if custom_prompt else "Please generate my full startup wealth audit and tactical recommendations."}
"""

        gemini_key = os.getenv("GEMINI_API_KEY")

        if HAS_GEMINI and gemini_key:
            try:
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                
                system_instruction = """
You are MeraPaisa's elite AI Financial Advisor.
Provide a highly personalized, premium, and actionable Financial Audit Report in markdown.
Your response MUST be divided into the following beautiful sections:
1. 📊 Executive Financial Summary: A modern, clear breakdown of their financial health.
2. ⚠️ Key Risk Factors & Recommendations: Specific warnings (e.g. high debt-to-income, exceeding budgets, lack of diversified investments) with premium startup-grade suggestions.
3. 🎯 Immediate Action Items: Bullet points of what they should do next (e.g., pay off specific informal debts, cut down category X expense, allocate 10% more to index assets).
4. 📈 Strategic Growth Paths: Opportunities for optimization, tax efficiency, and long-term asset building.

Format all output using standard markdown. Use clear headers, tables, warning bold callouts, and bullet points. Keep the tone sophisticated, motivating, professional, and startup-grade.
"""
                response = model.generate_content(system_instruction + "\n\n" + context_prompt)
                return Response({"report": response.text}, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"Gemini API call failed, using offline generator: {e}")

        # Fallback offline generator
        report_md = f"""# 📊 MeraPaisa Elite AI Wealth Audit Report

## 1. 📊 Executive Financial Summary
Welcome back, **{user.username}**. We have audited your active financial tables and compiled a high-performance assessment of your net capital streams.

### Core Capital Metrics
| Metric | Value | Status |
| :--- | :--- | :--- |
| **Total Income** | ₹{income_total:,.2f} | Mapped |
| **Total Expenses** | ₹{expense_total:,.2f} | Tracked |
| **Net Savings Rate** | {round(((income_total - expense_total)/income_total)*100, 1) if income_total > 0 else 0.0}% | { "Optimal 📈" if (income_total - expense_total) > 0.3 * income_total else "Requires Optimization ⚠️" } |
| **Active Investments** | ₹{total_investments:,.2f} | Active portfolio |

---

## 2. ⚠️ Key Risk Factors & Recommendations
Based on your database profile, our algorithms identified the following checkpoints:
"""

        has_risks = False
        if expense_total > income_total:
            report_md += "\n- **🚨 Deficit Spending**: Your recorded expenses exceed your active income! This represents an unsustainable burn rate. We recommend freezing discretionary expenses immediately.\n"
            has_risks = True
        
        over_budget = [b for b in budget_details if b['spent'] > b['limit']]
        if over_budget:
            report_md += "\n- **⚠️ Budget Breaches**: You have crossed your target boundaries in some categories:\n"
            for ob in over_budget:
                report_md += f"  - Category *{ob['category']}* has exceeded its limit of ₹{ob['limit']:,.2f} by reaching ₹{ob['spent']:,.2f} ({ob['percentage']}%).\n"
            has_risks = True

        active_debts = [d for d in debt_details if d['status'] == 'UNPAID']
        if active_debts:
            report_md += "\n- **💸 Informal Liabilities**: You have outstanding unpaid informal debts that need settlements. Prioritize clearing outstanding dues to maintain financial creditworthiness.\n"
            has_risks = True

        if not has_risks:
            report_md += "\n- **🟢 Health Check Clean**: Excellent! You do not have any active budget breaches or deficit spending risks logged. Keep maintaining this robust discipline!\n"

        report_md += f"""
---

## 3. 🎯 Immediate Action Items
To maximize your wealth compounding immediately, complete the following actions:
1. **Optimize High-Burn Segments**: Review your expense records and allocate at least 20% of your current income to high-yield assets.
2. **Setup Smart EMIs**: Ensure that your EMI payments are aligned with your active bank accounts to prevent late payment penances.
3. **Diversify Holdings**: Your registered assets total ₹{total_investments:,.2f}. If this is concentrated in single holdings, consider diversifying into liquid indices.

---

## 4. 📈 Strategic Growth Paths
- **Automated Tax Harvesting**: Strategize asset sales to capture long-term capital gains tax exemptions under prevailing frameworks.
- **Systematic Investment Plans (SIP)**: Configure recurring investments on standard index products to automate savings discipline.

---

*Note: This report has been calculated dynamically from your data. Connect your Gemini API Key in the environment to unlock personalized conversational audits.*
"""
        return Response({"report": report_md}, status=status.HTTP_200_OK)


class RecycleBinViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        user = request.user
        deleted_items = []

        # Transactions soft-deleted
        txs = Transaction.objects.filter(user=user, is_deleted=True)
        for t in txs:
            deleted_items.append({
                "id": t.id,
                "type": "Transaction",
                "title": f"Transaction: {t.category.name if t.category else 'Uncategorized'} - ₹{t.amount}",
                "date": str(t.date)
            })

        # Loans soft-deleted
        loans = Loan.objects.filter(user=user, is_deleted=True)
        for l in loans:
            deleted_items.append({
                "id": l.id,
                "type": "Loan",
                "title": f"Bank Loan: {l.name} - ₹{l.total_principal}",
                "date": str(l.start_date)
            })

        # Debts soft-deleted
        debts = Debt.objects.filter(user=user, is_deleted=True)
        for d in debts:
            deleted_items.append({
                "id": d.id,
                "type": "Debt",
                "title": f"Informal Debt: {d.person_name} ({d.debt_type}) - ₹{d.amount}",
                "date": str(d.transaction_date)
            })

        # Assets soft-deleted
        assets = Asset.objects.filter(user=user, is_deleted=True)
        for a in assets:
            deleted_items.append({
                "id": a.id,
                "type": "Asset",
                "title": f"Investment: {a.symbol} ({a.name}) - Qty {a.quantity}",
                "date": str(a.last_updated.date())
            })

        return Response(deleted_items, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        item_type = request.data.get('type')
        user = request.user

        try:
            if item_type == 'Transaction':
                obj = Transaction.objects.get(id=pk, user=user, is_deleted=True)
            elif item_type == 'Loan':
                obj = Loan.objects.get(id=pk, user=user, is_deleted=True)
            elif item_type == 'Debt':
                obj = Debt.objects.get(id=pk, user=user, is_deleted=True)
            elif item_type == 'Asset':
                obj = Asset.objects.get(id=pk, user=user, is_deleted=True)
            else:
                return Response({"error": "Invalid item type."}, status=status.HTTP_400_BAD_REQUEST)

            obj.is_deleted = False
            obj.save()
            return Response({"message": f"{item_type} restored successfully!"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Item not found or already restored: {str(e)}"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete', 'post'])
    def purge(self, request, pk=None):
        item_type = request.data.get('type') or request.query_params.get('type')
        user = request.user

        try:
            if item_type == 'Transaction':
                obj = Transaction.objects.get(id=pk, user=user, is_deleted=True)
            elif item_type == 'Loan':
                obj = Loan.objects.get(id=pk, user=user, is_deleted=True)
            elif item_type == 'Debt':
                obj = Debt.objects.get(id=pk, user=user, is_deleted=True)
            elif item_type == 'Asset':
                obj = Asset.objects.get(id=pk, user=user, is_deleted=True)
            else:
                return Response({"error": "Invalid item type."}, status=status.HTTP_400_BAD_REQUEST)

            obj.delete()
            return Response({"message": f"{item_type} permanently purged from database!"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Item not found: {str(e)}"}, status=status.HTTP_404_NOT_FOUND)


class FinancialExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format_type):
        user = request.user
        transactions = Transaction.objects.filter(user=user, is_deleted=False).order_by('-date')
        month_name = date.today().strftime('%B') # e.g. "May"

        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="merapaisa_{month_name}_statement.csv"'

            writer = csv.writer(response)
            writer.writerow(['Date', 'Category', 'Type', 'Amount', 'Description'])
            
            for tx in transactions:
                writer.writerow([
                    tx.date,
                    tx.category.name if tx.category else 'Uncategorized',
                    tx.category.type if tx.category else 'EXPENSE',
                    tx.amount,
                    tx.description or ''
                ])
            return response

        elif format_type == 'pdf':
            if not HAS_REPORTLAB:
                # Fallback elegant HTML document dynamic rendering
                html_fallback = f"""
                <html>
                <head>
                    <title>MeraPaisa Statement Fallback</title>
                    <style>
                        body {{ font-family: sans-serif; padding: 40px; background-color: #0f172a; color: #f8fafc; }}
                        .container {{ max-width: 800px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 25px; border: 1px solid rgba(255,255,255,0.08); }}
                        h1 {{ color: #60a5fa; }}
                        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                        th, td {{ padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; }}
                        th {{ color: #94a3b8; font-weight: bold; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>MeraPaisa Dynamic Wealth Statement Fallback</h1>
                        <p>User: {user.username} | Email: {user.email}</p>
                        <table>
                            <thead>
                                <tr><th>Date</th><th>Category</th><th>Type</th><th>Amount</th><th>Description</th></tr>
                            </thead>
                            <tbody>
                                {"".join([f"<tr><td>{tx.date}</td><td>{tx.category.name if tx.category else 'Uncategorized'}</td><td>{tx.category.type if tx.category else 'EXPENSE'}</td><td>Rs. {tx.amount}</td><td>{tx.description or ''}</td></tr>" for tx in transactions])}
                            </tbody>
                        </table>
                    </div>
                </body>
                </html>
                """
                response = HttpResponse(html_fallback, content_type='text/html')
                response['Content-Disposition'] = f'attachment; filename="merapaisa_{month_name}_statement.html"'
                return response


            # PDF Document Generation using ReportLab
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
            story = []
            styles = getSampleStyleSheet()

            # Custom styles
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Heading1'],
                fontSize=22,
                textColor=colors.HexColor('#1e3a8a'),
                spaceAfter=12
            )
            body_style = ParagraphStyle(
                'BodyStyle',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor('#334155'),
                spaceAfter=6
            )

            story.append(Paragraph(f"MeraPaisa Elite Financial Statement", title_style))
            story.append(Paragraph(f"User: {user.username} | Email: {user.email}", body_style))
            story.append(Paragraph(f"Report Generated: {date.today().strftime('%B %d, %Y')}", body_style))
            story.append(Spacer(1, 15))

            # Header & data list
            data = [['Date', 'Category', 'Type', 'Amount', 'Description']]
            total_income = 0.0
            total_expense = 0.0

            for tx in transactions:
                cat_name = tx.category.name if tx.category else 'Uncategorized'
                cat_type = tx.category.type if tx.category else 'EXPENSE'
                amt = float(tx.amount)
                
                if cat_type == 'INCOME':
                    total_income += amt
                    amt_str = f"+ Rs. {amt:,.2f}"
                else:
                    total_expense += amt
                    amt_str = f"- Rs. {amt:,.2f}"

                data.append([
                    str(tx.date),
                    cat_name,
                    cat_type,
                    amt_str,
                    tx.description or ''
                ])

            # Build flowable tables
            t = Table(data, colWidths=[80, 100, 70, 100, 190])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8fafc')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('FONTSIZE', (0,0), (-1,-1), 9),
            ]))
            story.append(t)
            story.append(Spacer(1, 20))

            # Add Aggregations summaries
            story.append(Paragraph(f"<b>Total Income:</b> Rs. {total_income:,.2f}", body_style))
            story.append(Paragraph(f"<b>Total Expenses:</b> Rs. {total_expense:,.2f}", body_style))
            story.append(Paragraph(f"<b>Net Savings:</b> Rs. {(total_income - total_expense):,.2f}", body_style))

            doc.build(story)
            pdf = buffer.getvalue()
            buffer.close()

            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="merapaisa_{month_name}_statement.pdf"'
            response.write(pdf)
            return response

        return Response({"error": "Invalid format. Use pdf or csv."}, status=status.HTTP_400_BAD_REQUEST)


class SchedulerTriggerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            from apps.utils.scheduler import MeraPaisaBackgroundScheduler
            MeraPaisaBackgroundScheduler.send_email_statement_digest(request.user)
            return Response({
                "status": "success",
                "message": "Asynchronous background statement generation triggered! Check your inbox or console logs."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to launch background worker: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)