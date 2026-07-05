import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route" 


export async function GET() {
  try {

			const session = await getServerSession(authOptions);
				
			
							if (!session) {
									return NextResponse.json(
											{ message: "Unauthorized" },
											{ status: 401 }
									);
							}

						if(session?.user?.email!=="admin@Goldy")	{
									return NextResponse.json(
											{ message: "Unauthorized" },
											{ status: 401 }
									);
						}

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

const loans = await db.collection("loans").find({ removeMark: { $ne: true } }).toArray();

    let cashAmount = 0;
    let upiAmount = 0;

    let cashCount = 0;
    let upiCount = 0;

    const transactions = [];

    loans.forEach((loan) => {
      (loan.payments || []).forEach((payment) => {
        // Only Paid EMIs
        if (payment.status !== "Paid") return;

      let amount =
        Number(payment.amount || 0)

        if(payment.finePaid){
          amount+=payment.fine
        }

        // Calculate totals
        if (payment.paymentMode === "Cash") {
          cashAmount += amount;
          cashCount++;
        } else if (payment.paymentMode === "UPI") {
          upiAmount += amount;
          upiCount++;
        }

        // Save transaction
        transactions.push({
          loanId: loan._id,
          customerId: loan.customerId,
          customerName: loan.customerName,
          mobile: loan.mobile,
          productName: loan.productName,
          salesmanName: loan.salesmanName,

          emiDate: loan.emiDate, // 1,11,21

          emiNo: payment.emiNo,
          amount: payment.amount,
          fine: payment.fine || 0,
          totalAmount: amount,

          paymentMode: payment.paymentMode,
          paidDate: payment.paidDate,
          dueDate: payment.dueDate,

          remarks: payment.remarks || "",
        });
      });
    });

    // Latest payments first
    transactions.sort(
      (a, b) => new Date(b.paidDate) - new Date(a.paidDate)
    );

const dates = ["1", "11", "21"].map((day) => {
  const dayLoans = loans.filter((loan) => loan.emiDate == day);

  let cashAmount = 0;
  let upiAmount = 0;

  let cashCount = 0;
  let upiCount = 0;

  dayLoans.forEach((loan) => {
    
    (loan.payments || []).forEach((payment) => {
      if (payment.status === "Pending") return;

      let amount =
        Number(payment.amount || 0)

        if(payment.finePaid){
          amount+=payment.fine
        }

      if (payment.paymentMode === "Cash") {
        cashAmount += amount;
        cashCount++;
      } else if (payment.paymentMode === "UPI") {
        upiAmount += amount;
        upiCount++;
      }
    });
  });

  return {
    day,
    loanCount: dayLoans.length,

    cashAmount,
    cashCount,

    upiAmount,
    upiCount,

    totalAmount: cashAmount + upiAmount,
    totalPayments: cashCount + upiCount,
  };
});

    return NextResponse.json({
      success: true,

      stats: {
        cash: {
          amount: cashAmount,
          count: cashCount,
        },
        upi: {
          amount: upiAmount,
          count: upiCount,
        },
      },

      transactions,
						dates
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}