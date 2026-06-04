type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail({ html, subject, text, to }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      ok: false,
      error:
        "Email non configurata. Aggiungi RESEND_API_KEY e EMAIL_FROM in .env.local.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    return {
      ok: false,
      error: `Invio email non riuscito: ${errorText}`,
    };
  }

  return { ok: true, error: "" };
}

export function verificationEmail(link: string) {
  return {
    subject: "Verifica il tuo account MediFamily",
    text: `Conferma il tuo account MediFamily aprendo questo link: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #29302d; line-height: 1.6">
        <h1 style="color: #5573ad">Verifica il tuo account MediFamily</h1>
        <p>Conferma il tuo indirizzo email per usare la dashboard del tuo nucleo familiare.</p>
        <p>
          <a href="${link}" style="display: inline-block; background: #315a45; color: white; padding: 12px 16px; border-radius: 8px; text-decoration: none; font-weight: 700">
            Verifica email
          </a>
        </p>
        <p>Se il pulsante non funziona, copia questo link:</p>
        <p style="word-break: break-all">${link}</p>
      </div>
    `,
  };
}

export function resetPasswordEmail(link: string) {
  return {
    subject: "Reimposta la password MediFamily",
    text: `Imposta una nuova password MediFamily aprendo questo link: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #29302d; line-height: 1.6">
        <h1 style="color: #5573ad">Reimposta la password</h1>
        <p>Abbiamo ricevuto una richiesta per cambiare la password del tuo account MediFamily.</p>
        <p>
          <a href="${link}" style="display: inline-block; background: #315a45; color: white; padding: 12px 16px; border-radius: 8px; text-decoration: none; font-weight: 700">
            Cambia password
          </a>
        </p>
        <p>Se non hai richiesto tu questa modifica, puoi ignorare questa email.</p>
        <p style="word-break: break-all">${link}</p>
      </div>
    `,
  };
}

export function inviteEmail({
  familyName,
  inviterName,
  link,
}: {
  familyName: string;
  inviterName: string;
  link: string;
}) {
  return {
    subject: `${inviterName} ti ha invitata su MediFamily`,
    text: `${inviterName} ti ha invitata nel nucleo "${familyName}" su MediFamily. Accetta l'invito: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #29302d; line-height: 1.6">
        <h1 style="color: #5573ad">Invito MediFamily</h1>
        <p><strong>${inviterName}</strong> ti ha invitata nel nucleo <strong>${familyName}</strong>.</p>
        <p>
          <a href="${link}" style="display: inline-block; background: #315a45; color: white; padding: 12px 16px; border-radius: 8px; text-decoration: none; font-weight: 700">
            Accetta invito
          </a>
        </p>
        <p style="word-break: break-all">${link}</p>
      </div>
    `,
  };
}
