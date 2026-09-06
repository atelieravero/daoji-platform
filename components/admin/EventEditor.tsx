'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Settings2, RotateCw, CalendarDays, MapPin, Radio, Globe2 } from 'lucide-react';
import MediaPicker from '@/components/admin/MediaPicker';
import { FormInput, FormSelect, FormToggle } from '@/components/ui/FormControls';
import { AssetRecord } from '@/app/admin/(dashboard)/assets/actions';
import { SUPPORTED_TIMEZONES, DEFAULT_TIMEZONE } from '@/lib/timezones';
import { toDateTimeLocalString, toDateInputString, fromDateTimeLocalToUTC, describeRecurrenceRule } from '@/lib/date';
import { 
  saveEventAction, 
  listVenuesAction, 
  listOrganizersAction,
  EventRecord, 
  VenueRecord, 
  OrganizerRecord,
  EventStatus, 
  RegistrationStatus, 
  RegistrationMode,
  EventLanguage,
  LivestreamConfig
} from '@/app/admin/(dashboard)/events/actions';

import EditorLayout from '@/components/admin/editor/EditorLayout';
import EditorHeader from '@/components/admin/editor/EditorHeader';
import CoverBannerPicker from '@/components/admin/editor/CoverBannerPicker';
import UrlSlugInspector from '@/components/admin/editor/UrlSlugInspector';
import BilingualCanvas from '@/components/admin/editor/BilingualCanvas';
import VenueModal from '@/components/admin/events/VenueModal';
import OrganizerModal from '@/components/admin/events/OrganizerModal';

const LANGUAGE_OPTIONS: { id: EventLanguage; labelEn: string; labelZh: string }[] = [
  { id: 'cantonese', labelEn: 'Cantonese', labelZh: '粵語' },
  { id: 'mandarin', labelEn: 'Mandarin', labelZh: '華語普通話' },
  { id: 'english', labelEn: 'English', labelZh: '英語' },
  { id: 'thai', labelEn: 'Thai', labelZh: '泰語' },
];

interface EventEditorProps {
  initialEvent?: Partial<EventRecord>;
  isNew?: boolean;
}

export default function EventEditor({ initialEvent, isNew = false }: EventEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Identity State
  const [eventId, setEventId] = useState<string | undefined>(initialEvent?.id);
  const [shortId, setShortId] = useState<string | undefined>(initialEvent?.short_id);

  // Canvas View Mode
  const [isSplitView, setIsSplitView] = useState(true);
  const [activeLang, setActiveLang] = useState<'zh' | 'en'>('zh');

  // Timezone & Schedule State
  const [timezone, setTimezone] = useState(initialEvent?.timezone || DEFAULT_TIMEZONE);
  const [isAllDay, setIsAllDay] = useState(initialEvent?.is_all_day || false);

  const [startDate, setStartDate] = useState(
    initialEvent?.is_all_day
      ? toDateInputString(initialEvent?.start_date, timezone)
      : toDateTimeLocalString(initialEvent?.start_date, timezone)
  );

  const [endDate, setEndDate] = useState(
    initialEvent?.is_all_day
      ? toDateInputString(initialEvent?.end_date, timezone)
      : toDateTimeLocalString(initialEvent?.end_date, timezone)
  );

  // Content Fields
  const [titleZh, setTitleZh] = useState(initialEvent?.title_zh || '');
  const [titleEn, setTitleEn] = useState(initialEvent?.title_en || '');
  const [summaryZh, setSummaryZh] = useState(initialEvent?.summary_zh || '');
  const [summaryEn, setSummaryEn] = useState(initialEvent?.summary_en || '');
  const [bodyZh, setBodyZh] = useState(initialEvent?.body_zh || '');
  const [bodyEn, setBodyEn] = useState(initialEvent?.body_en || '');

  // Languages Multi-Select
  const [languages, setLanguages] = useState<EventLanguage[]>(initialEvent?.languages || ['cantonese']);

  // Recurrence
  const [isRecurring, setIsRecurring] = useState(Boolean(initialEvent?.recurrence_rule));
  const [recurrenceFreq, setRecurrenceFreq] = useState<'weekly' | 'monthly' | 'daily'>(initialEvent?.recurrence_rule?.frequency || 'weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(initialEvent?.recurrence_rule?.interval || 1);
  const [selectedDays, setSelectedDays] = useState<number[]>(initialEvent?.recurrence_rule?.days_of_week || [3]);
  const [recurrenceUntil, setRecurrenceUntil] = useState(initialEvent?.recurrence_rule?.until_date || '');
  const [blackoutDates, setBlackoutDates] = useState<string[]>(initialEvent?.blackout_dates || []);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');

  // Organizers State & Modals
  const [organizers, setOrganizers] = useState<OrganizerRecord[]>([]);
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<string>(initialEvent?.organizer_id || '');
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [organizerModalMode, setOrganizerModalMode] = useState<'create' | 'edit'>('create');

  // Venues State & Modals
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(initialEvent?.venue_id || '');
  const [venueOverrideZh, setVenueOverrideZh] = useState<string>(initialEvent?.venue_override_zh || '');
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [venueModalMode, setVenueModalMode] = useState<'create' | 'edit'>('create');

  // Format Dual Toggles
  const [isInPerson, setIsInPerson] = useState<boolean>(initialEvent?.is_in_person ?? true);
  const [isLivestream, setIsLivestream] = useState<boolean>(initialEvent?.is_livestream ?? false);

  // Livestream Multi-Platform State
  const [zoomUrl, setZoomUrl] = useState(initialEvent?.livestream_config?.zoom_url || '');
  const [zoomMeetingId, setZoomMeetingId] = useState(initialEvent?.livestream_config?.zoom_meeting_id || '');
  const [zoomPasscode, setZoomPasscode] = useState(initialEvent?.livestream_config?.zoom_passcode || '');
  const [youtubeUrl, setYoutubeUrl] = useState(initialEvent?.livestream_config?.youtube_url || '');
  const [facebookUrl, setFacebookUrl] = useState(initialEvent?.livestream_config?.facebook_url || '');
  const [openMinutesBefore, setOpenMinutesBefore] = useState<number>(initialEvent?.livestream_config?.open_minutes_before || 15);

  // Registration & Participation Gate
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>(initialEvent?.registration_mode || 'internal_form');
  const [code, setCode] = useState<string>(initialEvent?.code || '');
  const [linkedFormId, setLinkedFormId] = useState<string>(initialEvent?.linked_form_id || '');
  const [externalUrl, setExternalUrl] = useState<string>(initialEvent?.external_url || '');
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>(initialEvent?.registration_status || 'upcoming');
  const [ctaLabelEn, setCtaLabelEn] = useState<string>(initialEvent?.cta_label_en || '');
  const [ctaLabelZh, setCtaLabelZh] = useState<string>(initialEvent?.cta_label_zh || '');

  // Active Cropped Display Banner
  const [bannerAssetUrl, setBannerAssetUrl] = useState<string | null>(initialEvent?.banner_asset?.file_url || null);
  const [bannerAssetId, setBannerAssetId] = useState<string | null>(initialEvent?.banner_asset_id || null);

  // Original Master Asset (always used as crop source)
  const [bannerOriginalAssetUrl, setBannerOriginalAssetUrl] = useState<string | null>(
    initialEvent?.banner_original_asset?.file_url || initialEvent?.banner_asset?.file_url || null
  );
  const [bannerOriginalAssetId, setBannerOriginalAssetId] = useState<string | null>(
    initialEvent?.banner_original_asset_id || initialEvent?.banner_asset_id || null
  );

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [status, setStatus] = useState<EventStatus>(initialEvent?.status || 'draft');
  const [isFeatured, setIsFeatured] = useState<boolean>(initialEvent?.is_featured || false);
  const [slug, setSlug] = useState<string>(initialEvent?.slug || '');

  useEffect(() => {
    listVenuesAction().then((res) => {
      if (res.data) setVenues(res.data);
    });
    listOrganizersAction().then((res) => {
      if (res.data) setOrganizers(res.data);
    });
  }, []);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);
  const selectedOrganizer = organizers.find((o) => o.id === selectedOrganizerId);

  const handleVenueSelect = (vId: string) => {
    setSelectedVenueId(vId);
    const matchedVenue = venues.find((v) => v.id === vId);
    if (matchedVenue?.timezone) {
      setTimezone(matchedVenue.timezone);
    }
  };

  const handleToggleAllDay = (nextAllDay: boolean) => {
    setIsAllDay(nextAllDay);
    if (nextAllDay) {
      setStartDate((prev) => prev.split('T')[0]);
      setEndDate((prev) => prev.split('T')[0]);
    } else {
      setStartDate((prev) => (prev.includes('T') ? prev : `${prev || toDateInputString(null, timezone)}T09:00`));
      setEndDate((prev) => (prev.includes('T') ? prev : `${prev || toDateInputString(null, timezone)}T17:00`));
    }
  };

  const toggleLanguage = (lang: EventLanguage) => {
    setLanguages((prev) => {
      if (prev.includes(lang)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  };

  // Picking a fresh asset from Media Pool sets both current and original master asset
  const handleMediaSelect = (asset: AssetRecord) => {
    setBannerAssetUrl(asset.file_url);
    setBannerAssetId(asset.id);
    setBannerOriginalAssetUrl(asset.file_url);
    setBannerOriginalAssetId(asset.id);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    let startFormatted = '';
    let endFormatted = '';

    if (isAllDay) {
      startFormatted = startDate.split('T')[0];
      endFormatted = endDate.split('T')[0];
    } else {
      startFormatted = fromDateTimeLocalToUTC(startDate, timezone);
      endFormatted = fromDateTimeLocalToUTC(endDate, timezone);
    }

    if (!startFormatted || !endFormatted) {
      setErrorMessage('Please provide valid start and end dates.');
      setIsSaving(false);
      return;
    }

    if (registrationMode === 'internal_form' && !code.trim()) {
      setErrorMessage('Event code (1-8 chars) is required for internal form registration.');
      setIsSaving(false);
      return;
    }

    const livestreamConfig: LivestreamConfig | null = isLivestream
      ? {
          zoom_url: zoomUrl.trim() || null,
          zoom_meeting_id: zoomMeetingId.trim() || null,
          zoom_passcode: zoomPasscode.trim() || null,
          youtube_url: youtubeUrl.trim() || null,
          facebook_url: facebookUrl.trim() || null,
          open_minutes_before: Number(openMinutesBefore) || 15,
        }
      : null;

    const payload: Partial<EventRecord> = {
      ...(eventId ? { id: eventId } : {}),
      title_zh: titleZh,
      title_en: titleEn,
      summary_zh: summaryZh,
      summary_en: summaryEn,
      body_zh: bodyZh,
      body_en: bodyEn,
      languages,
      organizer_id: selectedOrganizerId || null,
      start_date: startFormatted,
      end_date: endFormatted,
      timezone,
      is_all_day: isAllDay,
      recurrence_rule: isRecurring
        ? {
            frequency: recurrenceFreq,
            interval: Number(recurrenceInterval) || 1,
            days_of_week: recurrenceFreq === 'weekly' ? selectedDays : undefined,
            until_date: recurrenceUntil || null,
          }
        : null,
      blackout_dates: blackoutDates,
      is_in_person: isInPerson,
      venue_id: isInPerson ? (selectedVenueId || null) : null,
      venue_override_zh: isInPerson ? (venueOverrideZh.trim() || null) : null,
      venue_override_en: isInPerson ? (venueOverrideZh.trim() || null) : null,
      is_livestream: isLivestream,
      livestream_config: livestreamConfig,
      registration_mode: registrationMode,
      code: registrationMode === 'internal_form' ? code.trim().toUpperCase() : null,
      linked_form_id: registrationMode === 'internal_form' ? (linkedFormId || null) : null,
      external_url: registrationMode === 'external_url' ? externalUrl.trim() : null,
      registration_status: registrationStatus,
      cta_label_en: ctaLabelEn,
      cta_label_zh: ctaLabelZh,
      banner_asset_id: bannerAssetId,
      banner_original_asset_id: bannerOriginalAssetId || bannerAssetId,
      status,
      is_featured: isFeatured,
      slug: slug || null,
    };

    try {
      const res = await saveEventAction(payload);
      if (res.success && res.data) {
        if (!eventId) {
          setEventId(res.data.id);
          window.history.replaceState(null, '', `/admin/events/${res.data.id}`);
        }
        if (res.data.short_id) {
          setShortId(res.data.short_id);
        }
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2500);
        router.refresh();
      } else {
        setErrorMessage(res.error || 'Failed to save event.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const recurrenceSummary = isRecurring
    ? describeRecurrenceRule(
        { frequency: recurrenceFreq, interval: recurrenceInterval, days_of_week: selectedDays, until_date: recurrenceUntil },
        startDate,
        'en-US'
      )
    : '';

  return (
    <>
      <EditorLayout
        errorMessage={errorMessage}
        onDismissError={() => setErrorMessage(null)}
        header={
          <EditorHeader
            backHref="/admin/events"
            title={titleZh || titleEn || 'Untitled Event'}
            codeBadge={registrationMode === 'internal_form' ? code : undefined}
            isSplitView={isSplitView}
            onToggleSplitView={setIsSplitView}
            previewUrl={slug || shortId ? `/zh/events/${slug || shortId}` : undefined}
            onSave={handleSave}
            isSaving={isSaving}
            saveLabel={isSaving ? 'Saving...' : justSaved ? 'Saved!' : 'Save Changes'}
          />
        }
        canvas={
          <BilingualCanvas
            isSplitView={isSplitView}
            activeLang={activeLang}
            onSelectLang={setActiveLang}
            titleZh={titleZh}
            onTitleZhChange={setTitleZh}
            titleEn={titleEn}
            onTitleEnChange={setTitleEn}
            summaryZh={summaryZh}
            onSummaryZhChange={setSummaryZh}
            summaryEn={summaryEn}
            onSummaryEnChange={setSummaryEn}
            bodyZh={bodyZh}
            onBodyZhChange={setBodyZh}
            bodyEn={bodyEn}
            onBodyEnChange={setBodyEn}
            bodyRows={12}
          />
        }
        inspector={
          <>
            <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50 shrink-0">
              <div className="flex items-center">
                <Settings2 className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Event Settings</span>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-white text-gray-950 border border-gray-300 shadow-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unlisted">Unlisted</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* 1. HERO BANNER (16:9 Event Ratio, crops from uncropped original) */}
              <CoverBannerPicker
                bannerUrl={bannerAssetUrl}
                originalBannerUrl={bannerOriginalAssetUrl || bannerAssetUrl}
                aspectRatio={16 / 9}
                aspectRatioLabel="16:9"
                onOpenPicker={() => setIsMediaPickerOpen(true)}
                onRemoveBanner={() => { 
                  setBannerAssetUrl(null); 
                  setBannerAssetId(null); 
                  setBannerOriginalAssetUrl(null);
                  setBannerOriginalAssetId(null);
                }}
                onCropSuccess={(croppedAsset) => {
                  setBannerAssetUrl(croppedAsset.file_url);
                  setBannerAssetId(croppedAsset.id);
                }}
              />

              <hr className="border-gray-100" />

              {/* 2. ORGANIZER & LANGUAGES */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Organizer & Language</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-950">Organizer</label>
                    <div className="flex items-center gap-2">
                      {selectedOrganizer && (
                        <button
                          type="button"
                          onClick={() => { setOrganizerModalMode('edit'); setShowOrganizerModal(true); }}
                          className="text-xs text-stone-600 hover:text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          title="Edit selected organizer"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setOrganizerModalMode('create'); setShowOrganizerModal(true); }}
                        className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        title="Register new organizer"
                      >
                        <Plus className="w-3.5 h-3.5" /> New
                      </button>
                    </div>
                  </div>
                  <FormSelect
                    value={selectedOrganizerId}
                    onChange={(e) => setSelectedOrganizerId(e.target.value)}
                  >
                    <option value="">-- No Organizer Assigned --</option>
                    {organizers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name_en} {o.name_zh ? `(${o.name_zh})` : ''}
                      </option>
                    ))}
                  </FormSelect>
                </div>

                {/* Delivery Languages Multi-Select */}
                <div className="space-y-2 pt-1">
                  <label className="text-sm font-semibold text-gray-950 flex items-center gap-1.5">
                    <Globe2 className="w-4 h-4 text-gray-500" />
                    <span>Delivery Languages</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGE_OPTIONS.map((opt) => {
                      const selected = languages.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleLanguage(opt.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            selected
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{opt.labelEn}</span>
                          <span className="text-[11px] font-normal text-gray-400">{opt.labelZh}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* 3. SCHEDULE & RECURRENCE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Schedule & Time</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isRecurring ? 'Recurring Series' : 'Single Session'}</span>
                  </div>
                </div>
                
                <FormSelect 
                  label="Timezone" 
                  value={timezone} 
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </FormSelect>

                {/* ALL DAY TOGGLE */}
                <FormToggle
                  label="All-Day Event"
                  helperText="Only calendar dates are recorded; hour and minute values are excluded."
                  checked={isAllDay}
                  onChange={handleToggleAllDay}
                />

                {/* DATE / DATETIME PICKERS */}
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label={isAllDay ? (isRecurring ? "First Session Date *" : "Start Date *") : (isRecurring ? "First Session Start *" : "Start Date & Time *")}
                    type={isAllDay ? "date" : "datetime-local"}
                    value={isAllDay ? startDate.split('T')[0] : startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    helperText={isRecurring ? "First occurrence" : undefined}
                    required
                  />
                  <FormInput
                    label={isAllDay ? (isRecurring ? "First Session End Date *" : "End Date *") : (isRecurring ? "First Session End *" : "End Date & Time *")}
                    type={isAllDay ? "date" : "datetime-local"}
                    value={isAllDay ? endDate.split('T')[0] : endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    helperText={isRecurring ? "Session span" : undefined}
                    required
                  />
                </div>

                {/* Recurrence Rule Manager */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                      Recurring Pattern (RFC-5545)
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isRecurring}
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        isRecurring ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isRecurring ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {isRecurring && (
                    <div className="space-y-4 pt-2 text-xs">
                      <div className="flex items-center gap-4 font-semibold text-gray-700">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="freq" checked={recurrenceFreq === 'weekly'} onChange={() => setRecurrenceFreq('weekly')} />
                          <span>Weekly</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="freq" checked={recurrenceFreq === 'monthly'} onChange={() => setRecurrenceFreq('monthly')} />
                          <span>Monthly</span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input type="radio" name="freq" checked={recurrenceFreq === 'daily'} onChange={() => setRecurrenceFreq('daily')} />
                          <span>Daily</span>
                        </label>
                      </div>

                      {recurrenceFreq === 'weekly' && (
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Repeat On Weekdays</label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setSelectedDays((prev) => prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx])}
                                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                                  selectedDays.includes(idx) ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <FormInput
                        label="Series Ends On (Until Date)"
                        type="date"
                        value={recurrenceUntil}
                        onChange={(e) => setRecurrenceUntil(e.target.value)}
                        helperText="Leave blank for indefinite repeat."
                      />

                      {/* Blackout Exception Dates */}
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        <label className="block text-[11px] font-semibold text-gray-700">Blackout Dates (Skip Occurrences)</label>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <FormInput
                              type="date"
                              value={newBlackoutDate}
                              onChange={(e) => setNewBlackoutDate(e.target.value)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (newBlackoutDate && !blackoutDates.includes(newBlackoutDate)) {
                                setBlackoutDates([...blackoutDates, newBlackoutDate]);
                                setNewBlackoutDate('');
                              }
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer self-start"
                          >
                            Add
                          </button>
                        </div>

                        {blackoutDates.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {blackoutDates.map((d) => (
                              <span key={d} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-mono">
                                <span>{d}</span>
                                <button type="button" onClick={() => setBlackoutDates(blackoutDates.filter((x) => x !== d))} className="cursor-pointer hover:font-bold">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {recurrenceSummary && (
                        <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 leading-relaxed font-medium">
                          <strong>Schedule:</strong> {recurrenceSummary}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* 4. LOCATION & FORMAT */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Format & Channels</h3>

                {/* In-Person Toggle */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-gray-900">In-Person Attendance</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isInPerson}
                      onClick={() => setIsInPerson(!isInPerson)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        isInPerson ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isInPerson ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {isInPerson && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-700">Registered Venue</label>
                        <div className="flex items-center gap-2">
                          {selectedVenue && (
                            <button
                              type="button"
                              onClick={() => { setVenueModalMode('edit'); setShowVenueModal(true); }}
                              className="text-xs text-stone-600 hover:text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                              title="Edit selected venue"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { setVenueModalMode('create'); setShowVenueModal(true); }}
                            className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            title="Register new venue"
                          >
                            <Plus className="w-3.5 h-3.5" /> New
                          </button>
                        </div>
                      </div>
                      <FormSelect
                        value={selectedVenueId}
                        onChange={(e) => handleVenueSelect(e.target.value)}
                      >
                        <option value="">-- Choose Venue --</option>
                        {venues.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name_en ? `${v.name_en} (${v.name_zh})` : v.name_zh} {v.timezone ? `[${v.timezone}]` : ''}
                          </option>
                        ))}
                      </FormSelect>
                      <FormInput
                        label="Venue Name Override (Optional)"
                        placeholder="e.g. Lantau Meditation Hall"
                        value={venueOverrideZh}
                        onChange={(e) => setVenueOverrideZh(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Livestream Toggle */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-gray-900">Online Livestream</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isLivestream}
                      onClick={() => setIsLivestream(!isLivestream)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        isLivestream ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          isLivestream ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {isLivestream && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 space-y-3">
                        <FormInput
                          label="Zoom Meeting URL"
                          placeholder="https://zoom.us/j/..."
                          value={zoomUrl}
                          onChange={(e) => setZoomUrl(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <FormInput
                            label="Zoom Meeting ID"
                            placeholder="123 456 7890"
                            value={zoomMeetingId}
                            onChange={(e) => setZoomMeetingId(e.target.value)}
                          />
                          <FormInput
                            label="Passcode"
                            placeholder="888888"
                            value={zoomPasscode}
                            onChange={(e) => setZoomPasscode(e.target.value)}
                          />
                        </div>
                      </div>

                      <FormInput
                        label="YouTube Live Stream URL"
                        placeholder="https://youtube.com/live/..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                      />

                      <FormInput
                        label="Facebook Live Stream URL"
                        placeholder="https://facebook.com/..."
                        value={facebookUrl}
                        onChange={(e) => setFacebookUrl(e.target.value)}
                      />

                      <FormInput
                        label="Enable Button Minutes Before Session"
                        type="number"
                        value={String(openMinutesBefore)}
                        onChange={(e) => setOpenMinutesBefore(Number(e.target.value))}
                        helperText="Button becomes clickable X minutes before start time."
                      />
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* 5. REGISTRATION GATE */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Registration Gate</h3>

                <FormSelect
                  label="Registration Mode"
                  value={registrationMode}
                  onChange={(e) => setRegistrationMode(e.target.value as RegistrationMode)}
                >
                  <option value="internal_form">Internal Form Application</option>
                  <option value="external_url">External Portal URL</option>
                  <option value="not_required">Not Required (Open Admission)</option>
                </FormSelect>

                {registrationMode === 'internal_form' && (
                  <div className="space-y-3 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
                    <FormInput
                      label="Event Code (1-8 Alphanumeric) *"
                      placeholder="e.g. STAY or ZEN26"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      helperText="Applicant token prefix. Non-unique across recurring cohorts."
                      required
                    />

                    <FormInput
                      label="Linked Form ID"
                      placeholder="Enter Form UUID or slug"
                      value={linkedFormId}
                      onChange={(e) => setLinkedFormId(e.target.value)}
                      helperText="Public button inherits status directly from this form."
                    />
                  </div>
                )}

                {registrationMode === 'external_url' && (
                  <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <FormInput
                      label="External Portal URL *"
                      placeholder="https://external-org.org/register"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      required
                    />

                    <FormSelect
                      label="Registration Status"
                      value={registrationStatus}
                      onChange={(e) => setRegistrationStatus(e.target.value as RegistrationStatus)}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </FormSelect>
                  </div>
                )}

                {registrationMode === 'not_required' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                    Displays passive informational badge on the event page.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <FormInput
                    label="Button Label (English)"
                    placeholder="e.g. Register Now"
                    value={ctaLabelEn}
                    onChange={(e) => setCtaLabelEn(e.target.value)}
                  />
                  <FormInput
                    label="Button Label (Chinese)"
                    placeholder="例如：立即報名"
                    value={ctaLabelZh}
                    onChange={(e) => setCtaLabelZh(e.target.value)}
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* 6. URL SLUG & FEATURED */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">URL & Presentation</h3>
                
                <UrlSlugInspector
                  slug={slug}
                  onChange={setSlug}
                  pathPrefix="/events/"
                />

                <FormToggle
                  label="Featured Event"
                  helperText="Pins event to hero banner position on public calendar."
                  checked={isFeatured}
                  onChange={setIsFeatured}
                />
              </div>

            </div>
          </>
        }
      />

      {/* MEDIA PICKER MODAL */}
      <MediaPicker
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        allowedCategory="image"
        title="Select Image from Media Pool"
      />

      {/* EXTRACTED ORGANIZER MODAL */}
      <OrganizerModal
        isOpen={showOrganizerModal}
        onClose={() => setShowOrganizerModal(false)}
        mode={organizerModalMode}
        initialData={organizerModalMode === 'edit' ? selectedOrganizer : null}
        onSuccess={(savedOrg) => {
          if (organizerModalMode === 'edit') {
            setOrganizers((prev) => prev.map((o) => (o.id === savedOrg.id ? savedOrg : o)));
          } else {
            setOrganizers((prev) => [...prev, savedOrg]);
          }
          setSelectedOrganizerId(savedOrg.id);
        }}
      />

      {/* EXTRACTED VENUE MODAL */}
      <VenueModal
        isOpen={showVenueModal}
        onClose={() => setShowVenueModal(false)}
        mode={venueModalMode}
        initialData={venueModalMode === 'edit' ? selectedVenue : null}
        onSuccess={(savedVenue) => {
          if (venueModalMode === 'edit') {
            setVenues((prev) => prev.map((v) => (v.id === savedVenue.id ? savedVenue : v)));
          } else {
            setVenues((prev) => [...prev, savedVenue]);
          }
          setSelectedVenueId(savedVenue.id);
          if (savedVenue.timezone) {
            setTimezone(savedVenue.timezone);
          }
        }}
      />
    </>
  );
}