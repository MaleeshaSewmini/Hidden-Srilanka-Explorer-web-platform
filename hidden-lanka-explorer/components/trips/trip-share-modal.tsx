"use client";

import { useState } from "react";
import { Trip, TripMember } from "@/lib/trip-planner/types";
import {
  X,
  Share2,
  Copy,
  Check,
  Printer,
  Users,
  Globe,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";

interface TripShareModalProps {
  trip: Trip;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTrip: (updated: Trip) => void;
}

export default function TripShareModal({
  trip,
  isOpen,
  onClose,
  onUpdateTrip,
}: TripShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedItinerary, setCopiedItinerary] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"editor" | "viewer">("editor");

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareToken = trip.share_token || trip.id;
  const shareUrl = `${origin}/trips/share/${shareToken}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {}
  };

  const handleCopyTextItinerary = async () => {
    const lines = [
      `🏝️ ${trip.title.toUpperCase()}`,
      `Starting Location: ${trip.start_location_name}`,
      `Duration: ${trip.duration_days} Day${trip.duration_days > 1 ? "s" : ""} · Travelers: ${trip.traveler_count}`,
      `Transport: ${trip.transport_mode.toUpperCase()}`,
      "----------------------------------------",
    ];

    const destinations = trip.destinations || [];
    destinations.forEach((d, i) => {
      const place = d.place;
      const name = place ? place.name : "Destination";
      const district = place?.district ? ` (${place.district})` : "";
      const slot = d.visit_time_slot ? ` [${d.visit_time_slot.toUpperCase()}]` : "";
      const notes = d.notes ? `\n   Note: ${d.notes}` : "";
      lines.push(`${i + 1}. Day ${d.day_number || 1}${slot}: ${name}${district}${notes}`);
    });

    lines.push("----------------------------------------");
    lines.push(`Total Estimated Cost: ${trip.budget_currency} ${trip.estimated_cost?.toLocaleString() || 0}`);
    lines.push("Planned with Hidden Sri Lanka Explorer");

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedItinerary(true);
      setTimeout(() => setCopiedItinerary(false), 3000);
    } catch {}
  };

  const handleTogglePublic = () => {
    const updated: Trip = {
      ...trip,
      is_public: !trip.is_public,
    };
    onUpdateTrip(updated);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    const newMember: TripMember = {
      id: `member-${Date.now()}`,
      trip_id: trip.id,
      user_id: `user-${Date.now()}`,
      invited_email: newMemberEmail.trim(),
      role: newMemberRole,
      status: "pending",
    };

    const currentMembers = trip.members || [];
    const updated: Trip = {
      ...trip,
      members: [...currentMembers, newMember],
    };

    onUpdateTrip(updated);
    setNewMemberEmail("");
  };

  const handleRemoveMember = (memberId: string) => {
    const currentMembers = trip.members || [];
    const updated: Trip = {
      ...trip,
      members: currentMembers.filter((m) => m.id !== memberId),
    };
    onUpdateTrip(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-gray-200 animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#123b26] text-[#c99a43]">
              <Share2 size={16} />
            </span>
            <h3 className="font-bold text-base text-[#0b2417]">
              Share & Collaborate on Trip
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:text-black"
          >
            <X size={18} />
          </button>
        </div>

        {/* Public Sharing Link */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#0b2417] flex items-center gap-1.5">
              {trip.is_public ? <Globe size={14} className="text-emerald-600" /> : <Lock size={14} />}
              <span>{trip.is_public ? "Public Web Link Active" : "Private Link (Token Gated)"}</span>
            </label>

            <button
              type="button"
              onClick={handleTogglePublic}
              className="text-xs font-bold text-[#c99a43] hover:underline"
            >
              {trip.is_public ? "Set to Private" : "Enable Public URL"}
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-[#f6f1e8] p-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent text-xs text-[#0b2417] outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 shrink-0 rounded-lg bg-[#123b26] px-3 py-1.5 text-sm font-bold text-white hover:bg-[] hover:text-[#0b2417] transition"
            >
              {copiedLink ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedLink ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Export & Print Options */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyTextItinerary}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-bold text-[#0b2417] hover:bg-gray-50"
          >
            {copiedItinerary ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copiedItinerary ? "Itinerary Copied!" : "Copy Full Text"}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white py-2.5 text-xs font-bold text-[#0b2417] hover:bg-gray-50"
          >
            <Printer size={14} />
            <span>Print / PDF Export</span>
          </button>
        </div>

        {/* Group Collaboration Members */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0b2417] flex items-center gap-1.5">
              <Users size={14} className="text-[#c99a43]" />
              <span>Group Trip Collaborators</span>
            </h4>
            <span className="text-xs text-gray-400">
              {(trip.members || []).length} members
            </span>
          </div>

          {/* Add member form */}
          <form onSubmit={handleAddMember} className="flex gap-2">
            <input
              type="email"
              placeholder="Invite collaborator email..."
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 px-3 py-1.5 text-xs outline-none"
            />
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value as "editor" | "viewer")}
              className="rounded-xl border border-gray-300 px-2 py-1.5 text-xs font-semibold"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-[#123b26] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#c99a43] hover:text-[#0b2417]"
            >
              <Plus size={14} />
            </button>
          </form>

          {/* Members list */}
          <div className="max-h-36 overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-100">
            {(trip.members || []).length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500">
                No collaborators invited yet. Enter an email to share editing rights.
              </div>
            ) : (
              trip.members?.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 text-xs"
                >
                  <div>
                    <span className="font-semibold text-gray-800">
                      {m.invited_email || m.user_name || "Fellow Traveler"}
                    </span>
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 capitalize">
                      {m.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-gray-400 hover:text-rose-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
