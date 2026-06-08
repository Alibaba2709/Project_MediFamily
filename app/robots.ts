import type { MetadataRoute } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://www.medifamilyapp.it"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/auth/register", "/auth/login"],
      disallow: [
        "/api/",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/archive",
        "/calendar",
        "/documents",
        "/medications",
        "/members/",
        "/payments",
        "/recipes",
        "/reminders",
        "/settings",
        "/verify-email",
        "/invite/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
