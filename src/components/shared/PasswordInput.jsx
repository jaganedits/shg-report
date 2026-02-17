import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[10px] font-semibold text-smoke uppercase tracking-wider mb-1">{label}</label>
      <div className="relative">
        <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-smoke/50" />
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
          className="w-full bg-ivory border border-sand rounded-lg text-xs py-2 pl-8 pr-9 text-charcoal placeholder:text-smoke/40 focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass/40 transition-all" />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-smoke/40 hover:text-smoke transition-colors">
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
