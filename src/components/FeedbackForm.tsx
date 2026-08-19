import React, { useState } from 'react';
import type { Lead, Feedback } from '../types';
import { Star, Upload, Video, CheckCircle2 } from 'lucide-react';
import { RenoletDatabase } from '../db';

interface FeedbackFormProps {
  lead: Lead;
  onFeedbackSubmitted: (feedback: Feedback) => void;
  addToast: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  lead,
  onFeedbackSubmitted,
  addToast
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mock upload simulator
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      const newPhotos = fileList.map(() => {
        // Mocking a local URL or base64 representation
        return `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80`; // Standard elegant door/window mockup photo
      });
      setUploadedPhotos([...uploadedPhotos, ...newPhotos]);
      addToast('success', 'Photos Added', `${fileList.length} site installation photos attached.`);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files);
      const newVideos = fileList.map(f => {
        return `/mock-site-video-${f.name}`;
      });
      setUploadedVideos([...uploadedVideos, ...newVideos]);
      addToast('success', 'Video Added', `Installation walkthrough video attached.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      addToast('error', 'Incomplete Form', 'Please enter some feedback comments.');
      return;
    }

    setIsSubmitting(true);

    const feedback: Feedback = {
      id: `F-${lead.id.replace('L-', '')}-${Math.random().toString(36).substring(2, 5)}`,
      leadId: lead.id,
      rating,
      reviewText,
      photos: uploadedPhotos,
      videos: uploadedVideos,
      submittedAt: new Date().toISOString()
    };

    // Save to Database
    const feedbacks = RenoletDatabase.getFeedbacks();
    feedbacks.push(feedback);
    RenoletDatabase.saveFeedbacks(feedbacks);

    // Update Lead status to Closed
    RenoletDatabase.updateLeadStatus(lead.id, 'Closed', 'Installation', 'Customer feedback logged and lead officially ARCHIVED.');

    addToast('success', 'Lead Closed Successfully', 'Customer feedback registered. Ticket is now archived.');
    onFeedbackSubmitted(feedback);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="font-bold text-slate-800 text-base">Customer Feedback & Installation Handover</h3>
        <p className="text-xs text-slate-500 mt-0.5">Collect ratings and upload handover media to close this lead</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        {/* Rating Select */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Customer Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 hover:scale-110 transition-transform focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${star <= (hoverRating ?? rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Text Review */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Remarks / Testimonial</label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="How was the window/door quality and fitting service?"
            rows={4}
            className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-brand-blue-sky text-xs text-slate-700"
            required
          />
        </div>

        {/* Photo Upload simulation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Site Installation Photos</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 border border-dashed border-slate-300 hover:border-brand-blue-sky hover:bg-slate-50 cursor-pointer rounded-xl px-4 py-3 text-xs font-semibold text-slate-600 transition-all flex-1 justify-center">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Upload Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadedPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {uploadedPhotos.map((url, index) => (
                  <div key={index} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                    <img src={url} alt="Site attachment" className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-[8px] text-white text-center py-0.5">Photo</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Upload Simulation */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Product Handover Video</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 border border-dashed border-slate-300 hover:border-brand-blue-sky hover:bg-slate-50 cursor-pointer rounded-xl px-4 py-3 text-xs font-semibold text-slate-600 transition-all flex-1 justify-center">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Upload Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadedVideos.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {uploadedVideos.map((vidName, index) => (
                  <div key={index} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 text-[10px] font-medium">
                    <Video className="w-3.5 h-3.5 text-brand-blue-sky" />
                    <span className="truncate max-w-[100px]">{vidName.replace('/mock-site-video-', '')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-semibold text-xs shadow-md transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {isSubmitting ? 'Processing Handoff...' : 'Submit Feedback & Close Lead'}
          </button>
        </div>
      </form>
    </div>
  );
};
