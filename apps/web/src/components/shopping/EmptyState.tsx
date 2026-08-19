import {
  PencilSquareIcon,
  MicrophoneIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";

const WAYS = [
  {
    icon: PencilSquareIcon,
    title: "Tapez le nom de l'article",
    help: "Dans la barre en bas, avec autocomplétion",
  },
  {
    icon: MicrophoneIcon,
    title: "Dictez à voix haute",
    help: "Appuyez sur le micro et parlez",
  },
  {
    icon: QrCodeIcon,
    title: "Scannez un code-barres",
    help: "Depuis la barre d'ajout ou le mode magasin",
  },
];

/** Écran 4k — état vide : "Trois façons de remplir cette liste". */
export function EmptyState() {
  return (
    <div className="flex flex-col gap-3 py-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--es-tertiary)]">
        Trois façons de remplir cette liste
      </p>
      <div className="flex flex-col gap-2">
        {WAYS.map(({ icon: Icon, title, help }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(255,107,53,0.1)] text-[#c8471c] dark:text-[#ffb694]">
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-[var(--es-ink)]">
                {title}
              </p>
              <p className="text-[11.5px] text-[var(--es-tertiary)]">{help}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
