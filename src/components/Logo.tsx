// Logo Show de Bola — usa o arquivo SVG oficial em public/logo.svg
// Se um dia voce trocar o arquivo, mantenha o mesmo nome e caminho.

type LogoProps = {
  size?: number
  className?: string
}

export function Logo({ size = 80, className = '' }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="Show de Bola — Casa de Festas"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ width: size, height: 'auto' }}
    />
  )
}
