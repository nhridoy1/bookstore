import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingBag } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Policies</p>
            <h1 className="font-heading text-3xl font-bold">Buy & Refund Policy</h1>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-foreground space-y-5">
          <p>
            This policy covers purchases made on BookJunky, including delivery, cancellations,
            and refunds.
          </p>

          <h2 className="font-heading text-xl font-semibold mt-6">1. Placing an Order</h2>
          <p>Orders are confirmed once payment is successful. You will receive an order confirmation notification with the order ID and estimated delivery.</p>

          <h2 className="font-heading text-xl font-semibold mt-6">2. Delivery</h2>
          <p>Standard delivery takes <strong>3–7 business days</strong>. You can track your order status from the Orders page: pending → processing → shipped → delivered.</p>

          <h2 className="font-heading text-xl font-semibold mt-6">3. Cancellations</h2>
          <p>Orders in the <em>pending</em> state can be cancelled at no charge. Once an order is being processed or shipped, cancellations are not guaranteed.</p>

          <h2 className="font-heading text-xl font-semibold mt-6">4. Refund Eligibility</h2>
          <p>You may request a refund within <strong>7 days</strong> of delivery if:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The book arrived damaged or defective.</li>
            <li>You received the wrong title or edition.</li>
            <li>Your order was cancelled before shipping.</li>
          </ul>

          <h2 className="font-heading text-xl font-semibold mt-6">5. Refund Process</h2>
          <p>Approved refunds are credited to the original payment method within <strong>5–10 business days</strong> after the returned book is received and inspected.</p>

          <h2 className="font-heading text-xl font-semibold mt-6">6. Non-refundable Items</h2>
          <p>Digital purchases, gift cards, and books marked "Final Sale" are not eligible for refunds unless defective.</p>

          <h2 className="font-heading text-xl font-semibold mt-6">7. How to Request a Refund</h2>
          <p>Open the order from your Orders page and contact support with the order ID and reason for return. A support agent will guide you through the return shipment.</p>

          <p className="text-sm text-muted-foreground mt-8">
            This page is maintained by BookJunky.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
