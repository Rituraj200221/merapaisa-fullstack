import time
import threading
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth.models import User
from django.conf import settings

class MeraPaisaBackgroundScheduler:
    """
    Decoupled lightweight multi-threaded daemon scheduler that runs asynchronous
    jobs in the background without blocking main request/response cycles.
    """
    _thread = None
    _stop_event = threading.Event()

    @classmethod
    def start(cls):
        if cls._thread is None:
            cls._stop_event.clear()
            cls._thread = threading.Thread(target=cls._scheduler_loop, daemon=True, name="MeraPaisaSchedulerThread")
            cls._thread.start()
            print("\033[94m[SCHEDULER]\033[0m Background task daemon thread initiated successfully! 🚀")

    @classmethod
    def stop(cls):
        if cls._thread is not None:
            cls._stop_event.set()
            cls._thread.join(timeout=1.0)
            cls._thread = None
            print("\033[94m[SCHEDULER]\033[0m Background task daemon thread stopped.")

    @classmethod
    def _scheduler_loop(cls):
        """
        Background scheduler daemon loop.
        Can perform periodic cleanups, trigger dynamic reminders, etc.
        """
        while not cls._stop_event.is_set():
            # Simply sleep and wait. In a real environment, it would compare dates/times.
            # We wake up every 3600 seconds (1 hour) to run cron checks.
            cls._stop_event.wait(timeout=3600)

    @classmethod
    def send_email_statement_digest(cls, user):
        """
        Run the heavy dynamic report generation and email dispatch asynchronously.
        """
        def task_worker():
            try:
                # 1. Fetch user-isolated financial metrics
                from apps.finances.models import Transaction, Budget
                from apps.portfolio.models import Asset
                from apps.obligations.models import Loan, Debt

                # Filter out soft-deleted items
                transactions = Transaction.objects.filter(user=user, is_deleted=False)
                income_total = 0.0
                expense_total = 0.0
                for tx in transactions:
                    amt = float(tx.amount)
                    if tx.category:
                        if tx.category.type == 'INCOME':
                            income_total += amt
                        elif tx.category.type == 'EXPENSE':
                            expense_total += amt

                loans = Loan.objects.filter(user=user, is_deleted=False)
                total_loan_amount = sum([float(l.total_principal) for l in loans])
                total_emi_amount = sum([float(l.emi_amount) for l in loans])

                debts = Debt.objects.filter(user=user, is_deleted=False)
                total_lent = sum([float(d.amount) for d in debts if d.debt_type == 'GIVEN'])
                total_borrowed = sum([float(d.amount) for d in debts if d.debt_type == 'TAKEN'])

                assets = Asset.objects.filter(user=user, is_deleted=False)
                total_invested = sum([float(a.quantity) * float(a.buy_price_avg) for a in assets])

                net_wealth = (income_total - expense_total) + total_lent + total_invested - total_loan_amount - total_borrowed

                # 2. Compile gorgeous HTML Email body
                html_body = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>MeraPaisa Weekly Wealth Summary</title>
                    <style>
                        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }}
                        .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
                        .header {{ background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; }}
                        .header h1 {{ margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }}
                        .header p {{ margin: 5px 0 0 0; color: #e0e7ff; font-size: 14px; }}
                        .content {{ padding: 30px; }}
                        .metric-card {{ background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); padding: 20px; text-align: center; margin-bottom: 25px; }}
                        .metric-card h2 {{ margin: 0 0 5px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }}
                        .metric-card div {{ font-size: 32px; font-weight: 800; color: #60a5fa; text-shadow: 0 0 15px rgba(96,165,250,0.2); }}
                        .table-title {{ font-size: 14px; font-weight: 700; color: #818cf8; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 5px; }}
                        .summary-table {{ width: 100%; border-collapse: collapse; margin-bottom: 25px; }}
                        .summary-table td {{ padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; color: #cbd5e1; }}
                        .summary-table td.label {{ font-weight: 600; color: #94a3b8; }}
                        .summary-table td.value {{ text-align: right; font-weight: 700; color: #f1f5f9; }}
                        .footer {{ text-align: center; padding: 20px; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>MeraPaisa Dynamic Wealth Digest</h1>
                            <p>Asynchronous Weekly Statement for {user.username}</p>
                        </div>
                        <div class="content">
                            <div class="metric-card">
                                <h2>Net Calculated Wealth</h2>
                                <div>₹{net_wealth:,.2f}</div>
                            </div>
                            
                            <div class="table-title">Capital Flow Overview</div>
                            <table class="summary-table">
                                <tr>
                                    <td class="label">Total Recorded Income</td>
                                    <td class="value" style="color: #34d399;">₹{income_total:,.2f}</td>
                                </tr>
                                <tr>
                                    <td class="label">Total Recorded Expenses</td>
                                    <td class="value" style="color: #f87171;">₹{expense_total:,.2f}</td>
                                </tr>
                            </table>

                            <div class="table-title">Financial Liabilities & Assets</div>
                            <table class="summary-table">
                                <tr>
                                    <td class="label">Investment Portfolio</td>
                                    <td class="value" style="color: #60a5fa;">₹{total_invested:,.2f}</td>
                                </tr>
                                <tr>
                                    <td class="label">Informal Lent Receivables</td>
                                    <td class="value" style="color: #2dd4bf;">₹{total_lent:,.2f}</td>
                                </tr>
                                <tr>
                                    <td class="label">Outstanding Bank Loans</td>
                                    <td class="value" style="color: #fb7185;">- ₹{total_loan_amount:,.2f}</td>
                                </tr>
                                <tr>
                                    <td class="label">Informal Borrowed Debts</td>
                                    <td class="value" style="color: #fb7185;">- ₹{total_borrowed:,.2f}</td>
                                </tr>
                                <tr>
                                    <td class="label">Monthly EMIs Due</td>
                                    <td class="value" style="color: #fca5a5;">- ₹{total_emi_amount:,.2f}</td>
                                </tr>
                            </table>
                            
                            <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.5; margin-top: 20px;">
                                *This asynchronous statement has been generated dynamically by the MeraPaisa multi-threaded daemon scheduler.
                            </p>
                        </div>
                        <div class="footer">
                            &copy; 2026 MeraPaisa Inc. Securely Managing Wealth.
                        </div>
                    </div>
                </body>
                </html>
                """

                # 3. Trigger email send (Console/SMTP logs)
                send_mail(
                    subject="MeraPaisa Asynchronous Wealth Statement Digest 📊",
                    message=strip_tags(html_body),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    html_message=html_body,
                    fail_silently=False
                )
                print(f"\033[92m[SCHEDULER]\033[0m Successfully dispatched async statement mail to {user.email}")
            except Exception as ex:
                print(f"\033[91m[SCHEDULER]\033[0m Failed to process asynchronous task statement email: {ex}")

        # Dispatch the task worker thread immediately
        threading.Thread(target=task_worker, daemon=True, name="MeraPaisaAsyncTaskWorker").start()
