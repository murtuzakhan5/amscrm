import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export const MeetingCalendar = ({ events, onEventClick, onDateSelect }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        editable={false}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        eventClick={(info) => {
          if (onEventClick) {
            onEventClick(info.event);
          }
        }}
        select={(selectInfo) => {
          if (onDateSelect) {
            onDateSelect(selectInfo);
          }
        }}
        height="auto"
      />
    </div>
  );
};
