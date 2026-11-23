import { Phone } from 'lucide-react';
import Header, { CUSTOMER_CARE_PHONE } from '../../components/customer/Header';
import SeoMetadata from '../../components/SeoMetadata';
import CompanyAttribution from '../../components/ui/CompanyAttribution';

const contactPhone = CUSTOMER_CARE_PHONE.replace(/\s/g, '');

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col pb-24">
      <SeoMetadata
        title="Contact Tastifyy | Customer Care"
        description="Contact Tastifyy customer care for help with local food discovery and ordering in Sakoli."
        canonicalPath="/contact"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: 'Contact Tastifyy',
          url: 'https://tastifyy.in/contact',
          about: { '@id': 'https://tastifyy.in/#organization' },
          mainEntity: {
            '@type': 'ContactPoint',
            telephone: CUSTOMER_CARE_PHONE,
            contactType: 'customer support',
          },
        }}
      />
      <Header />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center">
          <Phone className="w-10 h-10 mx-auto mb-5 text-brand-primary" aria-hidden="true" />
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Contact Tastifyy</h1>
          <p className="text-gray-600 mb-6">
            For help with food discovery and ordering, contact our customer care team.
          </p>
          <a
            href={`tel:${contactPhone}`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 font-bold text-white hover:bg-brand-secondary transition-colors"
          >
            <Phone className="w-4 h-4" aria-hidden="true" />
            {CUSTOMER_CARE_PHONE}
          </a>
          <CompanyAttribution className="mt-8 text-sm font-semibold text-gray-600" />
        </section>
      </main>
    </div>
  );
}
