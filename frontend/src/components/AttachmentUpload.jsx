import { Upload } from 'lucide-react';

export const AttachmentUpload = ({ files, setFiles }) => {
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));

    const merged = [...files, ...imageFiles];
    const deduped = merged.filter(
      (file, index, list) =>
        index === list.findIndex((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified),
    );

    setFiles(deduped.slice(0, 3));
    event.target.value = '';
  };

  const removeFile = (targetFile) => {
    setFiles(files.filter((file) => file !== targetFile));
  };

  const clearFiles = () => {
    setFiles([]);
  };

  return (
    <div className="glass-panel rounded-2xl border-dashed border-white/20 p-8 text-center transition-all hover:glass-panel-strong">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(249,115,22,0.12)] text-[var(--primary)] ring-4 ring-[rgba(249,115,22,0.08)]">
        <Upload size={24} />
      </div>

      <label className="mx-auto inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] px-6 py-2.5 text-xs font-semibold tracking-wide text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95">
        Browse Images
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={files.length >= 3}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      <p className="mt-4 text-xs font-medium text-[var(--text-secondary)]">Only image files are allowed. Maximum 3 files. ({files.length}/3 selected)</p>

      {files?.length > 0 && (
        <div className="mt-6 space-y-3 text-left">
          {files.map((file) => {
            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
            return (
              <div key={fileKey} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-section)] border border-[var(--border)] px-4 py-3 backdrop-blur-sm">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">{file.name}</p>
                <button
                  type="button"
                  onClick={() => removeFile(file)}
                  className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors px-2 py-1 bg-[rgba(249,115,22,0.1)] rounded-lg"
                >
                  Remove
                </button>
              </div>
            );
          })}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={clearFiles}
              className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
