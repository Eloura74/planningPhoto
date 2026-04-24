import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import { fr } from "date-fns/locale";

function Calendar({ slots, onSlotClick, getSlotStatus, getSlotColor }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getSlotsForDay = (date) => {
    return slots.filter((slot) => isSameDay(new Date(slot.date), date));
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const getSlotTypeLabel = (type) => {
    return type === "SOLO" ? "Solo" : "Groupe";
  };

  return (
    <div className="rounded-xl shadow-lg overflow-hidden card-dark">
      <div
        className="px-4 sm:px-6 py-4"
        style={{
          background: "var(--chrome-gradient)",
          color: "var(--text-dark)",
        }}
      >
        <div className="flex justify-between items-center">
          <button
            onClick={previousMonth}
            className="px-3 py-2 sm:px-4 rounded-lg transition font-semibold text-sm sm:text-base"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "var(--text-dark)",
            }}
          >
            ← Mois précédent
          </button>
          <h2
            className="text-xl sm:text-2xl font-bold"
            style={{ color: "var(--text-dark)" }}
          >
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h2>
          <button
            onClick={nextMonth}
            className="px-3 py-2 sm:px-4 rounded-lg transition font-semibold text-sm sm:text-base"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "var(--text-dark)",
            }}
          >
            Mois suivant →
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-xs md:text-sm uppercase tracking-wide"
              style={{ color: "var(--gold-primary)" }}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {days.map((day) => {
            const daySlots = getSlotsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={day.toISOString()}
                className={`min-h-20 md:min-h-32 p-1 md:p-3 rounded-xl border-2 transition-all ${
                  isToday
                    ? "glow-gold"
                    : isCurrentMonth
                      ? "card-dark hover:shadow-md"
                      : "opacity-50"
                }`}
                style={{
                  borderColor: isToday
                    ? "var(--gold-primary)"
                    : isCurrentMonth
                      ? "var(--border-secondary)"
                      : "var(--border-primary)",
                  backgroundColor: isToday
                    ? "rgba(255, 215, 0, 0.1)"
                    : isCurrentMonth
                      ? "var(--bg-card)"
                      : "var(--bg-tertiary)",
                }}
              >
                <div
                  className={`font-semibold mb-1 md:mb-2 text-xs md:text-base`}
                  style={{
                    color: isToday
                      ? "var(--gold-primary)"
                      : isCurrentMonth
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                  }}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1 md:space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => onSlotClick(slot)}
                      className="p-1 md:p-2 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: getSlotColor(getSlotStatus(slot)),
                      }}
                    >
                      <div
                        className="text-[10px] md:text-xs font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {slot.start_time}
                      </div>
                      <div
                        className="text-[10px] md:text-xs hidden md:block"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {getSlotTypeLabel(slot.type)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
