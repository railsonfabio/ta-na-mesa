import React from "react";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "horizontal" | "vertical";
  role?: "cliente" | "garcom" | "gestao";
  theme?: "light" | "dark";
  withDescriptor?: boolean;
  className?: string;
}

export function Logo({
  size = "md",
  variant = "full",
  role = "cliente",
  theme = "light",
  withDescriptor = false,
  className = "",
}: LogoProps) {
  // Cores oficiais do Kit de Identidade Visual v1.1
  const roleColors = {
    cliente: "#BD4D2D", // Terracota Oficial
    garcom: "#694838",  // Garçom Salão
    gestao: "#302E2D",  // Gestão PDV
  };

  const brandTerracotta = "#BD4D2D";
  const brandCharcoal = "#231F1C";
  const iconBg = roleColors[role] || brandTerracotta;

  const iconDimensions = {
    xs: "w-6 h-6 rounded-lg",
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
    lg: "w-12 h-12 rounded-2xl",
    xl: "w-16 h-16 rounded-3xl",
  };

  const titleSizes = {
    xs: "text-xs font-black",
    sm: "text-sm font-black",
    md: "text-base font-black",
    lg: "text-xl font-black",
    xl: "text-2xl font-black",
  };

  const descriptorSizes = {
    xs: "text-[8px] tracking-wider",
    sm: "text-[9px] tracking-wider",
    md: "text-[10px] tracking-widest",
    lg: "text-xs tracking-widest",
    xl: "text-sm tracking-widest",
  };

  // Vetor Oficial Tá na Mesa: 256x256
  // Geometria precisa do símbolo aprovado (refeição à mesa com convidados)
  const SymbolVector = ({ color = "#FFFFFF" }: { color?: string }) => (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[82%] h-[82%]"
      role="img"
      aria-label="Símbolo Tá na Mesa"
    >
      <path
        fill={color}
        fillRule="evenodd"
        d="M39 56 Q47 48 67 44 L186 22 Q202 18 207 29 Q211 37 203 49 Q195 63 200 76 Q203 83 214 85 Q232 87 237 105 Q239 111 237 120 L216 207 Q212 229 193 231 L81 231 Q61 230 58 211 L54 189 Q52 176 45 167 L30 148 Q22 137 20 123 L15 106 Q10 85 23 69 Q29 61 39 56 Z M195 132 A68 68 0 1 0 59 132 A68 68 0 1 0 195 132 Z"
      />
      <circle cx="221" cy="48" r="20" fill={color} />
      <circle cx="33" cy="207" r="20" fill={color} />
    </svg>
  );

  return (
    <div
      className={`inline-flex items-center select-none ${
        variant === "vertical" ? "flex-col text-center gap-2" : "gap-2.5"
      } ${className}`}
    >
      {/* SÍMBOLO OFICIAL (Proporção 76x76 com 62x62 centralizado e 7 de folga) */}
      <div
        style={{ backgroundColor: iconBg }}
        className={`${iconDimensions[size]} flex items-center justify-center text-white shadow-xs flex-shrink-0 transition-transform hover:scale-105`}
        title={`Tá na Mesa • Perfil ${role}`}
      >
        <SymbolVector color="#FFFFFF" />
      </div>

      {/* TIPOGRAFIA OFICIAL & DESCRITOR */}
      {variant !== "icon" && (
        <div className="flex flex-col leading-none">
          <span
            className={`${titleSizes[size]} tracking-tight font-extrabold ${
              theme === "dark" ? "text-white" : "text-[#231F1C]"
            }`}
          >
            Tá na <span style={{ color: brandTerracotta }}>Mesa</span>
          </span>

          {(withDescriptor || variant === "full" || variant === "horizontal") && (
            <span
              style={{ color: theme === "dark" ? "#FBF6EF" : brandTerracotta }}
              className={`${descriptorSizes[size]} font-bold uppercase mt-0.5`}
            >
              Restaurantes e Delivery
            </span>
          )}
        </div>
      )}
    </div>
  );
}
