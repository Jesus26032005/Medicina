import React, { useState } from 'react';
import { PlayCircle, X } from 'lucide-react';

export default function VideoTutorialModal({ title, videoId }) {
  const [open, setOpen] = useState(false);
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <>
      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10 sm:w-auto"
        onClick={() => setOpen(true)}
        type="button"
      >
        <PlayCircle aria-hidden="true" className="h-4 w-4" />
        Ver Video Tutorial
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-6 backdrop-blur-sm">
          <section className="w-full max-w-4xl rounded-lg bg-white p-4 text-slate-950 shadow-2xl dark:bg-slate-900 dark:text-white">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">{title}</h2>
              <button
                aria-label="Cerrar video"
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 aspect-video overflow-hidden rounded-md bg-slate-950">
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
        </div>
      ) : null}
    </>
  );
}
