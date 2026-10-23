type CompanyAttributionProps = {
  variant?: 'developed' | 'powered' | 'platform';
  className?: string;
};

const prefixes = {
  developed: 'Developed by ',
  powered: 'Powered by ',
  platform: 'Platform developed by ',
};

export default function CompanyAttribution({
  variant = 'developed',
  className = 'text-xs text-gray-500',
}: CompanyAttributionProps) {
  return (
    <p className={className}>
      {prefixes[variant]}
      <a
        href="https://nkskilledge.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        NKSKILLEDGE PRIVATE LIMITED
      </a>
    </p>
  );
}
