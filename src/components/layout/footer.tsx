import Link from "next/link"

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="font-arcade text-sm text-arcade-green mb-4">GAMES</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/games/phish-blaster" className="hover:text-arcade-green">PHISH BLASTER</Link></li>
            <li><Link href="/games/security-maze" className="hover:text-arcade-green">SECURITY MAZE</Link></li>
            <li><Link href="/games/team-battles" className="hover:text-arcade-green">TEAM BATTLES</Link></li>
            <li><Link href="/games/boss-fights" className="hover:text-arcade-green">BOSS FIGHTS</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-arcade text-sm text-arcade-cyan mb-4">RESOURCES</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/tutorials" className="hover:text-arcade-cyan">TUTORIALS</Link></li>
            <li><Link href="/cheat-codes" className="hover:text-arcade-cyan">CHEAT CODES</Link></li>
            <li><Link href="/server-status" className="hover:text-arcade-cyan">SERVER STATUS</Link></li>
            <li><Link href="/updates" className="hover:text-arcade-cyan">UPDATES</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-arcade text-sm text-arcade-magenta mb-4">COMPANY</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-arcade-magenta">ABOUT</Link></li>
            <li><Link href="/careers" className="hover:text-arcade-magenta">CAREERS</Link></li>
            <li><Link href="/partners" className="hover:text-arcade-magenta">PARTNERS</Link></li>
            <li><Link href="/contact" className="hover:text-arcade-magenta">CONTACT</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-arcade text-sm text-arcade-yellow mb-4">LEGAL</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-arcade-yellow">PRIVACY</Link></li>
            <li><Link href="/terms" className="hover:text-arcade-yellow">TERMS</Link></li>
            <li><Link href="/cookies" className="hover:text-arcade-yellow">COOKIES</Link></li>
            <li><Link href="/licenses" className="hover:text-arcade-yellow">LICENSES</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        <p>© 2025 PHISHNCLICK ARCADE. ALL RIGHTS RESERVED.</p>
        <div className="mt-4 space-x-4">
          <Link href="https://twitter.com" className="hover:text-arcade-cyan">TWITTER</Link>
          <Link href="https://discord.com" className="hover:text-arcade-cyan">DISCORD</Link>
          <Link href="https://github.com" className="hover:text-arcade-cyan">GITHUB</Link>
        </div>
      </div>
    </footer>
  )
}
