import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PlayCircle, X } from 'lucide-react';

export default function VideoTutorialModal({ buttonClassName = '', title, videoId }) {
  const [open, setOpen] = useState(false);
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        className={
          buttonClassName ||
          'flex h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10 sm:w-auto'
        }
        onClick={() => setOpen(true)}
        type="button"
      >
        <PlayCircle aria-hidden="true" className="h-4 w-4" />
        Ver Video Tutorial
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm sm:p-6"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <section
                aria-label={title}
                aria-modal="true"
                className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-900 dark:text-white sm:p-5"
                role="dialog"
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-base font-bold sm:text-lg">{title}</h2>
                  <button
                    aria-label="Cerrar video"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/10"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    <X aria-hidden="true" className="h-5 w-5" />
                  </button>
                </div>
                <div className="mt-4 aspect-video w-full overflow-hidden rounded-md bg-slate-950">
                  <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={embedUrl}
                    title={title}
                  />
                </div>
              </section>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
