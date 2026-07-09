import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen } from "lucide-react";

export default function BorrowPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Policies</p>
            <h1 className="font-heading text-3xl font-bold">Book Borrow Policy</h1>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-foreground space-y-5">
          <p>
            Welcome to BookJunky's lending program. This policy explains how borrowing works,
            what happens if a book is late, and how fines are calculated.
          </p>

          <h2 className="font-heading text-xl font-semibold mt-6">1. Borrowing Period</h2>
          <p>Each book can be borrowed for up to <strong>14 days</strong> from the approval date. You may borrow a maximum of <strong>3 books at a time</strong>.</p>

          <h2 className="font-heading text-xl font-semibold mt-6">2. Approval</h2>
          <p>Borrow requests are reviewed by the publisher or an administrator. You will be notified once your request is approved and the borrow period begins.</p>

          <h2 className="font-heading text-xl font-semibold mt-6">3. Returning a Book</h2>
          <p>Books must be returned on or before the due date. Mark the borrow as <em>returned</em> from your Borrows page once you deliver the book back.</p>

          <h2 className="font-heading text-xl font-semibold mt-6">4. Overdue Fines</h2>
          <p>
            If a book is not returned by its due date, the admin may issue a fine. The user
            receives a notification with the fine amount and a note. Fines must be cleared
            before any further borrow request is approved.
          </p>

          <h2 className="font-heading text-xl font-semibold mt-6">5. Damage & Loss</h2>
          <p>Users are responsible for the condition of borrowed books. Damaged or lost books may incur a replacement charge equal to the retail price of the book.</p>

          <h2 className="font-heading text-xl font-semibold mt-6">6. Cancellation</h2>
          <p>You can cancel a pending borrow request from the Borrows page before it is approved. Once approved, please contact support to cancel.</p>

          <p className="text-sm text-muted-foreground mt-8">
            This page is maintained by BookJunky. For questions, reach out via your account
            support channel.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
