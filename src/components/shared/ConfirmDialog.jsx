import { AlertTriangle, Trash2, X } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useLang } from '@/contexts/LangContext';
import T, { t } from '@/lib/i18n';

export default function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = 'danger', // 'danger' | 'warning'
}) {
  const lang = useLang();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${variant === 'danger' ? 'bg-ruby/10' : 'bg-brass/10'}`}>
              <AlertTriangle className={`w-4 h-4 ${variant === 'danger' ? 'text-ruby' : 'text-brass'}`} />
            </div>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>{t(T.cancel, lang)}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={variant === 'danger' ? 'bg-ruby hover:bg-ruby/80' : 'bg-brass hover:bg-brass/80'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmLabel || t(T.delete, lang)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
