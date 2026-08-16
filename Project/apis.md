# Website Routing Architecture

| Route Path | Persona | Accessibility | Primary Purpose & Flow |
| :--- | :--- | :--- | :--- |
| **`/`** | Public | Open | The landing page. Introduces the platform and routes users to their specific login portals. |
| **`/customer/login`** | Customer | Open | Login/Signup portal for users looking to order food. |
| **`/onboarding/customer`** | Customer | Protected | Profile setup for newly registered customers. |
| **`/customer/home`** | Customer | Protected | Basic web-based browsing/ordering interface (Mobile App is primary). |
| **`/restaurant/login`** | Restaurant | Open | Login portal for existing restaurant partners. |
| **`/restaurant`** | Restaurant | Open | Registration portal for new restaurant partners. |
| **`/onboarding/restaurant`** | Restaurant | Protected | Initial setup form (details, address, FSSAI) for new restaurants. |
| **`/onboarding/status`** | Multi | Protected | Waiting room screen shown while an application is pending Admin approval. |
| **`/restaurant/dashboard`** | Restaurant | Protected | The main Restaurant Dashboard (defaults to live Socket.IO Orders). |
| **`/restaurant/dashboard/menu`** | Restaurant | Protected | Interface for the restaurant to add, edit, or toggle menu items. |
| **`/onboarding/delivery`** | Delivery | Protected | Profile setup (vehicle, license) for new delivery partners. |
| **`/admin`** | Admin | Open | Dedicated secure login portal for system administrators. |
| **`/admin/dashboard`** | Admin | Protected | The Admin command center (Analytics, User/Restaurant Management, Support Tickets). |
