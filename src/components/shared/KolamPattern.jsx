export default function KolamPattern({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="15" cy="15" r="2" fill="currentColor" opacity="0.3"/>
      <circle cx="35" cy="15" r="2" fill="currentColor" opacity="0.3"/>
      <circle cx="55" cy="15" r="2" fill="currentColor" opacity="0.3"/>
      <circle cx="75" cy="15" r="2" fill="currentColor" opacity="0.3"/>
      <circle cx="95" cy="15" r="2" fill="currentColor" opacity="0.3"/>
      <path d="M15 15 Q25 5 35 15 Q45 25 55 15 Q65 5 75 15 Q85 25 95 15" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.2"/>
      <path d="M15 15 Q25 25 35 15 Q45 5 55 15 Q65 25 75 15 Q85 5 95 15" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.15"/>
    </svg>
  );
}
