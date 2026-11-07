/**
 * Gerador Oficial de Payload Pix (Padrão EMV® QRCPS-MPM / BRCode Banco Central do Brasil)
 * Calcula o checksum CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF) oficial do BACEN.
 */

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function sanitizeAscii(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function computeCrc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface PixBrCodeOptions {
  pixKey: string;
  merchantName: string;
  merchantCity?: string;
  amount: number;
  txid?: string;
  description?: string;
}

export function generatePixBrCode({
  pixKey,
  merchantName,
  merchantCity = "NATAL",
  amount,
  txid = "TANAMESA",
  description,
}: PixBrCodeOptions): string {
  const cleanKey = (pixKey || "financeiro@a2isolutions.com.br").trim();
  const cleanMerchant = sanitizeAscii(merchantName || "TA NA MESA", 25) || "TA NA MESA";
  const cleanCity = sanitizeAscii(merchantCity || "NATAL", 15) || "NATAL";
  const cleanTxid = sanitizeAscii(txid || "TANAMESA", 25).replace(/\s+/g, "") || "TANAMESA";

  // 00: Payload Format Indicator
  const pfi = formatEmvField("00", "01");

  // 26: Merchant Account Information - Pix (GUI br.gov.bcb.pix)
  const gui = formatEmvField("00", "br.gov.bcb.pix");
  const keyField = formatEmvField("01", cleanKey);
  const descField = description
    ? formatEmvField("02", sanitizeAscii(description, 25))
    : "";
  const merchantAccountInfo = formatEmvField("26", `${gui}${keyField}${descField}`);

  // 52: Merchant Category Code (0000 ou 5812 Restaurantes)
  const mcc = formatEmvField("52", "5812");

  // 53: Transaction Currency (986 = BRL)
  const currency = formatEmvField("53", "986");

  // 54: Transaction Amount
  const formattedAmount = amount > 0 ? formatEmvField("54", amount.toFixed(2)) : "";

  // 58: Country Code
  const country = formatEmvField("58", "BR");

  // 59: Merchant Name
  const nameField = formatEmvField("59", cleanMerchant);

  // 60: Merchant City
  const cityField = formatEmvField("60", cleanCity);

  // 62: Additional Data Field Template (05 = Reference Label / TXID)
  const additionalData = formatEmvField("62", formatEmvField("05", cleanTxid));

  // 63: CRC16 (ID "63" + Length "04" + 4 hex chars)
  const partialPayload = `${pfi}${merchantAccountInfo}${mcc}${currency}${formattedAmount}${country}${nameField}${cityField}${additionalData}6304`;
  const crc = computeCrc16(partialPayload);

  return `${partialPayload}${crc}`;
}
