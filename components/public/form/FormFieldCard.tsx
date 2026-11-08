// components/public/form/FormFieldCard.tsx
'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  UploadCloud,
  AlertCircle,
  Loader2,
  Check,
  Search,
} from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { extractTokenDigits } from '@/lib/form-engine-utils';
import { MobilePhoneInput, TokenDigitsInput } from './FormInputs';

interface FormFieldCardProps {
  field: any;
  locale: string;
  eventCode: string;
  value: any;
  t: Record<string, any>;
  tokenState?: { verifying: boolean; verified: boolean; error: string | null };
  uploadState?: { isUploading: boolean; progress: number; error?: string };
  onChange: (dataKey: string, value: any) => void;
  onResetInlineToken: (dataKey: string) => void;
  onInlineVerify: (dataKey: string, currentVal: string) => void;
  onOpenRecovery: (dataKey: string) => void;
  onFileUpload: (dataKey: string, file: File) => void;
  onFileRemove: (dataKey: string) => void;
}

export default function FormFieldCard({
  field,
  locale,
  eventCode,
  value,
  t,
  tokenState,
  uploadState,
  onChange,
  onResetInlineToken,
  onInlineVerify,
  onOpenRecovery,
  onFileUpload,
  onFileRemove,
}: FormFieldCardProps) {
  const fieldLabel =
    locale === 'zh'
      ? field.labelZh || field.labelEn || field.title || field.dataKey || ''
      : field.labelEn || field.labelZh || field.title || field.dataKey || '';
  const fieldDesc =
    locale === 'zh'
      ? field.descriptionZh || field.descriptionEn || ''
      : field.descriptionEn || field.descriptionZh || '';

  if (field.type === 'info') {
    return (
      <div className="bg-surface-cream border border-surface-dark p-6 rounded-2xl">
        <h3 className="text-base font-bold text-ink-primary mb-1.5">{fieldLabel}</h3>
        {fieldDesc && (
          <MarkdownRenderer
            content={fieldDesc}
            baseHeadingLevel={4}
            className="text-[15px] leading-[1.8] text-ink-body mt-2"
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface-card p-6 rounded-2xl shadow-xs border border-surface-dark space-y-3">
      <label className="block text-[15px] font-semibold text-ink-primary leading-snug">
        {fieldLabel} {field.required && <span className="text-status-danger ml-0.5">*</span>}
      </label>
      {fieldDesc && (
        <MarkdownRenderer
          content={fieldDesc}
          baseHeadingLevel={5}
          className="text-xs md:text-[13px] leading-relaxed text-ink-muted"
        />
      )}

      {field.type === 'number' ? (
        <div className="relative mt-2">
          <input
            type="number"
            required={field.required}
            min={field.min}
            max={field.max}
            step={
              field.decimals !== undefined
                ? field.decimals === 0
                  ? '1'
                  : String(Math.pow(10, -field.decimals))
                : 'any'
            }
            value={value ?? ''}
            onChange={(e) => onChange(field.dataKey, e.target.value)}
            onBlur={(e) => {
              if (e.target.value !== '' && field.decimals !== undefined && field.decimals > 0) {
                const parsed = parseFloat(e.target.value);
                if (!isNaN(parsed)) {
                  onChange(field.dataKey, parsed.toFixed(field.decimals));
                }
              }
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-surface-dark text-sm font-mono focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-ink-primary bg-surface-card transition-shadow"
            placeholder={field.decimals === 2 ? '0.00' : field.decimals === 0 ? '0' : '...'}
          />
        </div>
      ) : field.type === 'text' || field.type === 'email' ? (
        <input
          type={field.type}
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(field.dataKey, e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-surface-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-ink-primary bg-surface-card transition-shadow mt-2"
          placeholder="..."
        />
      ) : field.type === 'textarea' ? (
        <textarea
          rows={4}
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(field.dataKey, e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-surface-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-ink-primary bg-surface-card transition-shadow mt-2"
          placeholder="..."
        />
      ) : field.type === 'mobile' ? (
        <div className="mt-2">
          <MobilePhoneInput
            required={field.required}
            value={value || ''}
            onChange={(val) => onChange(field.dataKey, val)}
          />
        </div>
      ) : field.type === 'date' ? (
        <div className="relative mt-2">
          <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-ink-muted" />
          <input
            type="date"
            required={field.required}
            value={value || ''}
            onChange={(e) => onChange(field.dataKey, e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-surface-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-ink-primary bg-surface-card transition-shadow"
          />
        </div>
      ) : field.type === 'time' ? (
        <div className="mt-2 flex items-center gap-2 max-w-[200px]">
          <div className="relative flex-1">
            <Clock className="absolute left-3.5 top-3 w-4 h-4 text-ink-muted" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="HH"
              value={(value || '').split(':')[0] || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                if (val !== '' && parseInt(val, 10) > 23) return;
                const currentMm = (value || '').split(':')[1] || '';
                onChange(field.dataKey, val || currentMm ? `${val}:${currentMm}` : '');
              }}
              onBlur={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val) {
                  const padded = val.padStart(2, '0');
                  const currentMm = (value || '').split(':')[1] || '';
                  onChange(field.dataKey, `${padded}:${currentMm}`);
                }
              }}
              className="w-full pl-10 pr-2 py-2.5 rounded-xl border border-surface-dark text-sm font-mono text-center focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-ink-primary bg-surface-card transition-shadow"
            />
          </div>
          <span className="text-ink-muted font-bold select-none">:</span>
          <div className="flex-1">
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="MM"
              value={(value || '').split(':')[1] || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 2);
                if (val !== '' && parseInt(val, 10) > 59) return;
                const currentHh = (value || '').split(':')[0] || '';
                onChange(field.dataKey, currentHh || val ? `${currentHh}:${val}` : '');
              }}
              onBlur={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                if (val) {
                  const padded = val.padStart(2, '0');
                  const currentHh = (value || '').split(':')[0] || '';
                  onChange(field.dataKey, `${currentHh}:${padded}`);
                }
              }}
              className="w-full px-2 py-2.5 rounded-xl border border-surface-dark text-sm font-mono text-center focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-ink-primary bg-surface-card transition-shadow"
            />
          </div>
        </div>
      ) : field.type === 'file' ? (
        <div className="mt-2">
          {value ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center truncate">
                <CheckCircle2 className="w-5 h-5 text-status-success mr-2 shrink-0" />
                <span className="text-sm font-medium text-status-success truncate">
                  {value.split('/').pop() || t.uploadedFile}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onFileRemove(field.dataKey)}
                className="text-xs text-status-danger hover:opacity-80 font-medium ml-4 shrink-0 cursor-pointer"
              >
                {t.remove}
              </button>
            </div>
          ) : uploadState?.isUploading ? (
            <div className="p-4 border border-surface-dark rounded-xl bg-surface-base">
              <div className="flex justify-between text-xs font-medium text-ink-muted mb-2">
                <span>{t.uploading}</span>
                <span>{uploadState.progress || 0}%</span>
              </div>
              <div className="w-full bg-surface-dark rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress || 0}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="relative border-2 border-dashed border-surface-dark rounded-xl p-6 flex flex-col items-center justify-center text-center bg-surface-base hover:bg-surface-cream/60 transition-colors group">
              <input
                type="file"
                required={field.required}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) onFileUpload(field.dataKey, e.target.files[0]);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*,.pdf,.doc,.docx"
              />
              <UploadCloud className="w-8 h-8 text-ink-muted mb-2 group-hover:text-primary transition-colors" />
              <span className="text-sm font-semibold text-ink-body group-hover:text-primary transition-colors">
                {t.clickToUpload}
              </span>
              <span className="text-xs text-ink-muted mt-1">{t.fileTypes}</span>
              {uploadState?.error && (
                <p className="text-xs text-status-danger font-medium mt-3 flex items-center justify-center text-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" /> {uploadState.error}
                </p>
              )}
            </div>
          )}
        </div>
      ) : field.type === 'applicant_token' ? (
        <div className="mt-3 space-y-2.5">
          {(() => {
            const rawVal = value || '';
            const digitCount = extractTokenDigits(rawVal, eventCode).length;
            const isFieldVerified = Boolean(tokenState?.verified);
            const isVerifying = Boolean(tokenState?.verifying);
            const isError = tokenState?.error;

            return (
              <>
                <div className="flex gap-2">
                  <TokenDigitsInput
                    eventCode={eventCode}
                    value={rawVal}
                    required={field.required}
                    isVerified={isFieldVerified}
                    isError={Boolean(isError)}
                    placeholder={t.tokenPlaceholder || '1234-5678'}
                    onChangeDigits={(formatted) => {
                      onChange(field.dataKey, formatted ? `${eventCode}-${formatted}` : '');
                      if (tokenState?.verified || tokenState?.error) {
                        onResetInlineToken(field.dataKey);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => onInlineVerify(field.dataKey, rawVal)}
                    disabled={digitCount !== 8 || isVerifying || isFieldVerified}
                    className="px-5 py-2.5 bg-surface-cream hover:bg-primary-soft text-ink-primary hover:text-primary text-sm font-semibold rounded-xl border border-surface-dark hover:border-primary-border transition-colors disabled:opacity-50 flex items-center justify-center min-w-[100px] cursor-pointer"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFieldVerified ? (
                      <Check className="w-5 h-5 text-status-success" />
                    ) : (
                      t.verify
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    {isError && (
                      <p className="text-xs text-status-danger font-medium flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> {isError}
                      </p>
                    )}
                    {isFieldVerified && (
                      <p className="text-xs text-status-success font-medium flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {t.tokenVerified}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenRecovery(field.dataKey)}
                    className="text-xs font-semibold text-ink-muted hover:text-primary transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Search className="w-3 h-3" />
                    <span>{t.forgotTokenShort}</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      ) : field.type === 'select' ? (
        <select
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(field.dataKey, e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-surface-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-surface-card text-ink-primary transition-shadow mt-2"
        >
          <option value="">{t.selectDefault}</option>
          {field.options?.map((opt: any, idx: number) => {
            const optionLabel =
              locale === 'zh'
                ? opt.labelZh || opt.labelEn || opt.value || ''
                : opt.labelEn || opt.labelZh || opt.value || '';
            return (
              <option key={idx} value={opt.value}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      ) : field.type === 'radio' ? (
        <div className="space-y-2.5 mt-2">
          {field.options?.map((opt: any, idx: number) => {
            const optionLabel =
              locale === 'zh'
                ? opt.labelZh || opt.labelEn || opt.value || ''
                : opt.labelEn || opt.labelZh || opt.value || '';
            const isChecked = value === opt.value;

            return (
              <label key={idx} className="flex items-center space-x-3 text-sm text-ink-body cursor-pointer group">
                <input
                  type="radio"
                  name={field.dataKey}
                  required={field.required && !value}
                  checked={isChecked}
                  onChange={() => onChange(field.dataKey, opt.value)}
                  onClick={(e) => {
                    if (!field.required && isChecked) {
                      e.currentTarget.checked = false;
                      onChange(field.dataKey, '');
                    }
                  }}
                  className="w-4 h-4 accent-primary border-surface-dark focus:ring-primary cursor-pointer"
                />
                <span className="group-hover:text-ink-primary transition-colors">{optionLabel}</span>
              </label>
            );
          })}
        </div>
      ) : field.type === 'checkbox' ? (
        <div className="space-y-2.5 mt-2">
          {field.options?.map((opt: any, idx: number) => {
            const optionLabel =
              locale === 'zh'
                ? opt.labelZh || opt.labelEn || opt.value || ''
                : opt.labelEn || opt.labelZh || opt.value || '';
            const currentVals = value || [];
            const isChecked = currentVals.includes(opt.value);
            return (
              <label key={idx} className="flex items-center space-x-3 text-sm text-ink-body cursor-pointer group">
                <input
                  type="checkbox"
                  required={field.required && currentVals.length === 0}
                  checked={isChecked}
                  onChange={(e) => {
                    let updated = [...currentVals];
                    if (e.target.checked) updated.push(opt.value);
                    else updated = updated.filter((v: string) => v !== opt.value);
                    onChange(field.dataKey, updated);
                  }}
                  className="w-4 h-4 accent-primary border-surface-dark rounded focus:ring-primary cursor-pointer"
                />
                <span className="group-hover:text-ink-primary transition-colors">{optionLabel}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}