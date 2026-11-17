import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";

/*
|--------------------------------------------------------------------------
| Helper: Convert date into YYYY-MM-DD
|--------------------------------------------------------------------------
*/
function getDateKey(value) {
  if (!value) return null;

  // If already YYYY-MM-DD
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

/*
|--------------------------------------------------------------------------
| 1. GET
|--------------------------------------------------------------------------
*/
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session?.user?.email !== "admin@Goldy") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { emiDate, salesmenid } = await params;

    if (!salesmenid) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing salesmanId",
        },
        { status: 400 }
      );
    }

    const { searchParams } = request.nextUrl;

    const targetDueDate = searchParams.get("dueDate");

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    /*
    |--------------------------------------------------------------------------
    | Current month/year
    |--------------------------------------------------------------------------
    */

    const today = new Date();

    let month = today.getMonth() + 1;
    let year = today.getFullYear();

    /*
    |--------------------------------------------------------------------------
    | If dueDate is supplied, use its month/year
    |--------------------------------------------------------------------------
    */

    if (targetDueDate) {
      const targetDate = new Date(targetDueDate);

      if (!Number.isNaN(targetDate.getTime())) {
        month = targetDate.getMonth() + 1;
        year = targetDate.getFullYear();
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Get active loans
    |--------------------------------------------------------------------------
    */

    const loanData = await db
      .collection("loans")
      .find({
        salesmanID: salesmenid,
        removeMark: { $ne: true },
        status: "Active",

        $or: [
          { emiDate: emiDate },
          { emiDate: Number(emiDate) },
          { emiDate: String(emiDate) },
        ],
      })
      .toArray();

    /*
    |--------------------------------------------------------------------------
    | Get hidden/cancelled dates from temp
    |--------------------------------------------------------------------------
    |
    | Example temp document:
    |
    | {
    |   salesmanId: "...",
    |   emiDate: "11",
    |   month: 9,
    |   year: 2026,
    |   dueDate: "2026-09-11",
    |   hide: true
    | }
    |
    */

    const tempData = await db
      .collection("temp")
      .find({
        salesmanId: salesmenid,
        emiDate: String(emiDate),
        month: month,
        year: year,
        hide: true,
      })
      .toArray();

    /*
    |--------------------------------------------------------------------------
    | Create Set of cancelled/hidden dates
    |--------------------------------------------------------------------------
    */

    const cancelledDates = new Set(
      tempData
        .map((temp) => getDateKey(temp.dueDate))
        .filter(Boolean)
    );

    /*
    |--------------------------------------------------------------------------
    | Remove hidden payments
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | dueDate is inside payments[].
    |
    | We DO NOT remove the complete loan.
    | We only remove the payment whose dueDate is hidden.
    |--------------------------------------------------------------------------
    */

    const loans = loanData
      .map((loan) => {
        const filteredPayments = (loan.payments || []).filter((payment) => {
          const paymentDate = getDateKey(payment.dueDate);

          // Remove payment if it exists in temp
          if (paymentDate && cancelledDates.has(paymentDate)) {
            return false;
          }

          return true;
        });

        return {
          ...loan,
          payments: filteredPayments,
        };
      })
      .filter((loan) => loan.payments.length > 0)
      .sort((a, b) => Number(a.emiDate) - Number(b.emiDate));

    /*
    |--------------------------------------------------------------------------
    | Get saved collections
    |--------------------------------------------------------------------------
    */

    const savedCollections = await db
      .collection("collections")
      .find({
        salesmenid: salesmenid,
        emiDate: String(emiDate),
      })
      .toArray();

    /*
    |--------------------------------------------------------------------------
    | Create taken map
    |--------------------------------------------------------------------------
    */

    const takenMap = {};

    savedCollections.forEach((col) => {
      if (col.dueDate) {
        const dateKey = getDateKey(col.dueDate);

        if (dateKey) {
          takenMap[dateKey] = Number(col.amount) || 0;
        }
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Group data by dueDate
    |--------------------------------------------------------------------------
    */

    const groupedData = {};

    loans.forEach((loan) => {
      loan.payments?.forEach((payment) => {
        if (!payment.dueDate) return;

        const dueDateKey = getDateKey(payment.dueDate);

        if (!dueDateKey) return;

        /*
        | If specific dueDate was requested,
        | only return that date.
        */

        if (targetDueDate && dueDateKey !== targetDueDate) {
          return;
        }

        if (!groupedData[dueDateKey]) {
          groupedData[dueDateKey] = {
            cash: 0,
            upi: 0,
            expected: 0,

            taken: takenMap[dueDateKey] || 0,

            customers: [],
          };
        }

        /*
        |--------------------------------------------------------------------------
        | Expected amount
        |--------------------------------------------------------------------------
        */

        groupedData[dueDateKey].expected +=
          Number(payment.amount) || 0;

        /*
        |--------------------------------------------------------------------------
        | Paid amount
        |--------------------------------------------------------------------------
        */

        if (payment.status === "Paid") {
          if (payment.paymentMode === "Cash") {
            groupedData[dueDateKey].cash +=
              Number(payment.amount) || 0;
          }

          if (payment.paymentMode === "UPI") {
            groupedData[dueDateKey].upi +=
              Number(payment.amount) || 0;
          }
        }

        /*
        |--------------------------------------------------------------------------
        | Customer
        |--------------------------------------------------------------------------
        */

        groupedData[dueDateKey].customers.push({
          customerId: loan.customerId,
          customerName: loan.customerName,

          paidDate: payment.paidDate,

          amount: payment.amount,

          mode: payment.paymentMode,

          status: payment.status,
        });
      });
    });

    /*
    |--------------------------------------------------------------------------
    | Sort dates
    |--------------------------------------------------------------------------
    */

    const sortedGroupedData = Object.fromEntries(
      Object.entries(groupedData).sort(
        ([dateA], [dateB]) =>
          new Date(dateA) - new Date(dateB)
      )
    );

    /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success: true,

      data: sortedGroupedData,

      /*
      | Dates that were hidden
      */
      hideDate: [...cancelledDates],

      salesmenName:
        loans[0]?.salesmanName || "Unknown Salesman",
    });
  } catch (error) {
    console.error("GET Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| 2. POST
|--------------------------------------------------------------------------
|
| Save collected/taken amount
|
*/
export async function POST(request, { params }) {
  try {
    const { emiDate, salesmenid } = await params;

    const { dueDate, amount } = await request.json();

    if (!dueDate || amount === undefined || !salesmenid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required properties (dueDate, amount, salesmanId)",
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    await db.collection("collections").updateOne(
      {
        dueDate: dueDate,
        salesmenid: salesmenid,
      },
      {
        $set: {
          emiDate: String(emiDate),
          amount: Number(amount),
          updatedAt: new Date(),
        },

        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
      }
    );

    return NextResponse.json({
      success: true,

      message: "Ledger recorded successfully",

      saved: {
        dueDate,
        amount: Number(amount),
      },
    });
  } catch (error) {
    console.error("POST Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| 3. PUT
|--------------------------------------------------------------------------
|
| Hide/cancel one EMI date
|
*/
export async function PUT(request, { params }) {
  try {
    const { emiDate, salesmenid } = await params;

    const body = await request.json();

    const session = await getServerSession(authOptions);

    /*
    |--------------------------------------------------------------------------
    | Admin check
    |--------------------------------------------------------------------------
    */

    if (!session || session.user.email !== "admin@Goldy") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Only hide request
    |--------------------------------------------------------------------------
    */

    if (body.hide !== true) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate salesman
    |--------------------------------------------------------------------------
    */

    if (!salesmenid) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing salesmanId",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate EMI date
    |--------------------------------------------------------------------------
    */

    const emiDay = Number(emiDate);

    if (
      !Number.isInteger(emiDay) ||
      emiDay < 1 ||
      emiDay > 31
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid EMI date",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Get month/year
    |--------------------------------------------------------------------------
    */

    const month = Number(body.month);
    const year = Number(body.year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid month",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(year)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid year",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate dueDate
    |--------------------------------------------------------------------------
    */

    if (!body.dueDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing dueDate",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Current date
    |--------------------------------------------------------------------------
    */

    const today = new Date();

    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    /*
    |--------------------------------------------------------------------------
    | Only current month/year
    |--------------------------------------------------------------------------
    */

    if (
      month !== currentMonth ||
      year !== currentYear
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only EMI dates from the current month can be hidden",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | EMI date must be previous
    |--------------------------------------------------------------------------
    */

    if (emiDay >= currentDay) {
      return NextResponse.json(
        {
          success: false,
          message: "This EMI date cannot be hidden yet",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Database
    |--------------------------------------------------------------------------
    */

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const tempCollection = db.collection("temp");

    /*
    |--------------------------------------------------------------------------
    | Normalize dueDate
    |--------------------------------------------------------------------------
    */

    const dueDate = getDateKey(body.dueDate);

    if (!dueDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid dueDate",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Check already hidden
    |--------------------------------------------------------------------------
    */

    const existing = await tempCollection.findOne({
      salesmanId: salesmenid,

      emiDate: String(emiDate),

      month: month,

      year: year,

      dueDate: dueDate,
    });

    if (existing) {
      return NextResponse.json({
        success: true,

        message: "This date is already hidden",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Insert hidden date
    |--------------------------------------------------------------------------
    */

    const result = await tempCollection.insertOne({
      salesmanId: salesmenid,

      emiDate: String(emiDate),

      month: month,

      year: year,

      dueDate: dueDate,

      hide: true,

      hiddenAt: new Date(),
    });

    return NextResponse.json({
      success: true,

      message: "EMI date hidden successfully",

      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("PUT Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
        error: error.message,
      },
      { status: 500 }
    );
  }
}