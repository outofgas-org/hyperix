import { BackgroundOrbs } from "./components/background-orbs";
import { Footer } from "./components/footer";
import { OrderbookDemo } from "./components/orderbook-demo";

export function App() {
  return (
    <main className="min-h-screen py-2 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="container mx-auto space-y-12 relative z-10">
        <h1 className="text-4xl font-bold">Hyperix</h1>

        <OrderbookDemo />

        <Footer technologies={["Bun", "React", "TypeScript", "Tailwind"]} />
      </div>
    </main>
  );
}
