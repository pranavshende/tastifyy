# SEO Keyword Map and Operations

Last updated: 2026-11-23

## Search intent mapping

| Intent | Representative queries | Target page | Indexing/data rule |
|---|---|---|---|
| Brand discovery | Tastifyy, Tastifyy.in, Tastifyy Sakoli, Tastifyy food | `/` (customer home) and `/customer/about` | Use the official Tastifyy brand name and canonical host. |
| Customer support | Contact Tastifyy, Tastifyy customer care | `/contact` | Uses only the customer-care phone already shown in the website header. |
| Sakoli local ordering | Food delivery in Sakoli, online food order Sakoli, food near Sakoli | `/food-delivery-in-sakoli` | Index only when current Sakoli restaurant listings are available; show no fabricated availability. |
| Restaurant discovery | Restaurants in Sakoli, `<restaurant name>` Sakoli | `/restaurant/<slug>--<id>` | Sitemap includes only active, approved, visible restaurants with available menu items. |
| Food and menu discovery | Pizza in Sakoli, burger in Sakoli, biryani in Sakoli, Chinese food in Sakoli | Eligible restaurant pages and their actual menu sections | Do not create standalone food/category pages until real listings support useful, distinct content. |

Use the mapped intent naturally in page copy and titles. Do not repeat keyword lists on pages or make ranking promises.

## Search Console setup

The site publishes `https://tastifyy.in/robots.txt` with a sitemap declaration for `https://tastifyy.in/sitemap.xml`. The `robots.txt` endpoint is live. Sitemap submission and URL inspection require the site owner to verify the domain in Google Search Console.

Recommended owner action:

1. Add the `tastifyy.in` Domain property in Google Search Console.
2. Copy Google's DNS TXT verification value into the domain's DNS provider and complete verification there. Do not commit the verification value or place it in source control.
3. After the Render backend is resumed and `https://tastifyy.in/sitemap.xml` returns valid XML, submit that sitemap URL and inspect the homepage and Sakoli landing page.

Google Analytics is not currently configured. Do not add analytics until the owner approves the property and required privacy/consent behavior.
