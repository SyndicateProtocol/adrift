import { Header } from "@/components/Header"
import { Links } from "@/components/Links"
import { Circle } from "@/components/sprites/Circle"
import SyndicateLogo from "@/components/sprites/SyndicateLogo"

export default function AboutPage() {
  return (
    <main className="p-4 max-w-7xl mx-auto">
      <Header />

      <div className="flex gap-6 flex-col md:flex-row">
        <section className="border border-foreground rounded-md flex-1">
          <div className="font-bold text-sm px-3 py-2 border-b border-b-foreground flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Circle className="w-4" />

              <h2 className="text-sm">Info</h2>
            </div>
            <p className="text-sm font-light text-forground italic">2025</p>
          </div>

          <div className="p-3 text-sm space-y-4">
            <p className="font-extrabold text-2xl mb-4">About Adrift</p>
            <p className="font-light">
              Adrift is a survival game built on its own appchain—a custom,
              application-specific blockchain.
            </p>
            <p className="font-light space-y-4">
              You’re a lone vessel at sea. Each day, you check in to repair your
              ship and survive whatever the ocean throws your way. Some days
              bring fortune. Others, disaster. Miss a check-in, and your boat
              starts to fall apart. Miss too many, and you’re lost to the waves.
              The last vessel afloat wins.
            </p>
            <p className="font-light">
              Adrift is more than just a game. It’s the first gaming appchain
              from Syndicate—a live demonstration of what onchain sequencing
              unlocks for onchain games.
            </p>

            <p className="font-extrabold text-2xl mt-8">
              How Onchain Sequencing Powers Adrift
            </p>
            <p className="font-light">
              Adrift looks simple—but under the surface, it runs on
              infrastructure purpose-built for games like this: fast, fair, and
              impossible to cheat.
            </p>

            <p className="font-light">
              Every day when you check in, the game triggers a random event. On
              most chains, randomness like this is either slow and clunky or
              fast but vulnerable to exploits—where players can undo bad
              outcomes or game the system.
            </p>
            <p className="font-light">
              Adrift works differently. Randomness is built directly into the
              chain itself. Once you check in, your outcome is locked. That’s
              because Adrift runs on its own appchain—where the rules aren’t
              just written in code, but enforced by the onchain sequencer, the
              part of the chain that orders and processes actions.
            </p>

            <p className="font-light">
              The result: smooth, tamper-proof, fully onchain gameplay.
            </p>

            <p className="font-extrabold text-2xl mt-8">Why Appchains Matter</p>

            <p className="font-light">
              With appchains, developers can program exactly how transactions
              are sequenced, how randomness works, how fees are structured, and
              how the game economy runs. The infrastructure adapts to the
              gameplay—not the other way around.
            </p>

            <p className="font-light">
              In Adrift, this means the rules aren’t just written in
              code—they’re enforced by the chain itself. The game doesn’t just
              run on a chain—the game is the chain. Every check-in, every
              outcome, every rule is hardwired into the infrastructure.
            </p>

            <p className="font-light">
              Adrift is just the beginning. It’s the first in a series of
              appchains from Syndicate—each designed to show what’s possible
              when developers and communities own the chain and control the
              network.
            </p>
          </div>
        </section>
        <div className="flex-1 flex-col flex gap-6">
          <section className="border border-foreground rounded-md flex-1 flex flex-col">
            <div className="font-bold text-sm px-3 py-2 border-b border-b-foreground flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Circle className="w-4" />

                <h2 className="text-sm">Built by Syndicate</h2>
              </div>
            </div>

            <div className="px-4 py-8 h-full flex justify-center">
              <SyndicateLogo className="w-full max-w-60 text-foreground my-auto" />
            </div>
          </section>
          <Links isAboutPage />
        </div>
      </div>
    </main>
  )
}
