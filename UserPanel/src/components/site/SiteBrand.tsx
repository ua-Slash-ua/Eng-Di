export function SiteBrand({ logoUrl }: { logoUrl?: string | null }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="EngDi" className="logo-img" />;
  }
  return (
    <>
      <span className="bubble">E</span>
      EngDi
    </>
  );
}
