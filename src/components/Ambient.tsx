export function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -top-40 -left-32 size-[560px] rounded-full bg-brand/40 blur-[120px] animate-drift" />
      <div className="absolute top-1/3 -right-40 size-[520px] rounded-full bg-accent/30 blur-[130px] animate-drift [animation-direction:reverse] [animation-duration:22s]" />
      <div className="absolute -bottom-40 left-1/3 size-[520px] rounded-full bg-violet/30 blur-[130px] animate-drift [animation-duration:26s]" />
    </div>
  );
}
