const SMS_URL = process.env.ANDROID_SMS_URL || "http://192.168.1.12:8080/message";
const SMS_USERNAME = "sms";
const SMS_PASSWORD = "smspassword";

function normalizeIndianPhone(phone) {
    const digits = String(phone || "").replace(/[^\d]/g, "");
    if (!digits) return "";
    if (String(phone).trim().startsWith("+")) return `+${digits}`;
    if (digits.startsWith("91") && digits.length >= 12) return `+${digits}`;
    return `+91${digits.replace(/^0/, "")}`;
}

export async function sendSms(text, phoneNumbers) {
    const recipients = phoneNumbers.map(normalizeIndianPhone).filter(Boolean);
    if (!recipients.length) return false;

    const payload = {
        textMessage: {
            text: text
        },
        phoneNumbers: recipients
    };

    const response = await fetch(SMS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${SMS_USERNAME}:${SMS_PASSWORD}`).toString("base64")}`
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
        throw new Error(`SMS service returned HTTP ${response.status}`);
    }

    return true;
}