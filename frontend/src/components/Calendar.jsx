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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <button
            onClick={previousMonth}
            className="px-3 py-2 sm:px-4 bg-white/20 rounded-lg hover:bg-white/30 transition font-semibold text-sm sm:text-base"
          >
            ← Mois précédent
          </button>
          <h2 className="text-xl sm:text-2xl font-bold">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </h2>
          <button
            onClick={nextMonth}
            className="px-3 py-2 sm:px-4 bg-white/20 rounded-lg hover:bg-white/30 transition font-semibold text-sm sm:text-base"
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
              className="text-center font-semibold text-gray-700 text-xs md:text-sm uppercase tracking-wide"
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
                    ? "border-indigo-500 bg-indigo-50"
                    : isCurrentMonth
                      ? "border-gray-200 hover:border-indigo-300 hover:shadow-md"
                      : "border-gray-100 bg-gray-50 opacity-50"
                }`}
              >
                <div
                  className={`font-semibold mb-1 md:mb-2 text-xs md:text-base ${isToday ? "text-indigo-600" : isCurrentMonth ? "text-gray-800" : "text-gray-400"}`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1 md:space-y-2">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => onSlotClick(slot)}
                      className={`p-1 md:p-2 rounded-lg cursor-pointer hover:scale-105 transition-transform ${getSlotColor(getSlotStatus(slot))}`}
                    >
                      <div className="text-[10px] md:text-xs font-semibold text-white">
                        {slot.start_time}
                      </div>
                      <div className="text-[10px] md:text-xs text-white/90 hidden md:block">
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
