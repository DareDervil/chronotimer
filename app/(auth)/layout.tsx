export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      {/* Extra radial glow behind the form */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, oklch(0.58 0.22 38 / 10%) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </main>
  )
}
