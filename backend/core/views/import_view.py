from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from core.models import Event, Task
from django.db import transaction

from datetime import datetime


class ImportView(APIView):
    
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        # The file that the user uploaded
        uploaded_file = request.FILES.get("file")

        # No file uploaded, this is an error
        if not uploaded_file:
            response = {
                "error": "No file uploaded"
            }
            return Response(response)
        
        # The file uploaded is not a .txt file, this is an error
        elif uploaded_file.content_type != "text/plain":
            response = {
                "error": "File type is not .txt"
            }
            return Response(response)
        

        # Reading the file
        content = uploaded_file.read().decode("utf-8")

        # Lines of the file are put into a list
        lines = content.splitlines()

        # A list of all the events, this is what is actually being imported
        # The idea is that every event that is not a duplicate will be put into this list,
        # at the very end, all events in this list will be added
        events = []

        # Tracks the current event being added, events will be added one-by-one,
        # as they need to be checked for validity e.g. contains required fields
        current_event = None

        # Not all files submitted are valid -> there is a standard iCalendar, other files are invalid
        # This will only be the case if the user manually modifies the file and makes errors
        # Any file uploaded that was generated from a website should generally work fine
        try:
            # Every event is uploaded to the DB, or none of them are
            # For example, an error here will cause no changes to be made to the DB
            # An example of an error is: invalid syntax
            with transaction.atomic():
                
                # Empty .txt file -> nothing to import
                if len(lines) == 0:
                    raise ValueError("Empty file")
                
                # File must begin with "BEGIN:VCALENDAR" -> otherwise it is not the correct format
                elif lines[0] != "BEGIN:VCALENDAR":
                    raise ValueError("File requires: BEGIN:VCALENDAR")
                
                # File must end with "END:VCALENDAR" -> otherwise it is not the correct format 
                elif lines[-1] != "END:VCALENDAR":
                    raise ValueError("File requires: END:VCALENDAR")

                # Line number tracker, returned to the user in case of errors
                count = 0

                # Each lines is read one-by-one
                for line in lines:
                    # Line count is tracked
                    count = count + 1

                    # This signifies that every line below it is information about the event
                    if line == "BEGIN:VEVENT":
                        # No event being worked on currently, so create a new one
                        if current_event == None:
                            # A dictionary is used here as this is what iCalendar uses
                            current_event = {}
                        # This error means that a new event was started before the previous one was ended
                        # This is an error with how the file is formatted
                        else:
                            raise ValueError(f"Event indentation error: line{count}")
                    
                    # This signifies that all the information about the event has been provided
                    elif line == "END:VEVENT":
                        # No event being worked on currently, so ending an event is an error
                        # (It is impossible to end an event if no event has started -> nothing to end)
                        if current_event == None:
                            raise ValueError(f"No event to end: line{count}")
                        
                        # If everything is correct so far, the event itself needs to be checked
                        else:
                            

                            # Every event must have a name, start date/time and end date/time
                            # Everything else is optional e.g. "description", these will be checked and added seperatelty
                            
                            # Summary is the name of the event, this is required
                            if "SUMMARY" in current_event:
                                summary = current_event["SUMMARY"]
    
                            else:
                                raise ValueError("One or more events don't have a summary")
                            
                            # The start & end dates are unique as they have a timezone attached to them e.g. DTSTART;TZID=Europe/London
                            # As many timezones are supported by the application it means that the process for finding this in the
                            # file is slightly more complex, each key needs to be searched to see if it contains "DTSTART" or "DTEND",
                            # if yes, then proceed as normal

                            # Assume that the event is invalid
                            start_date_time_exists = False
                            # Search every key
                            for key in current_event:
                                if "DTSTART" in key:
                                    # The actual date/time of the event
                                    dt_start = current_event[key]
                                    # The name of the timezone e.g. TZID=Europe/London
                                    dt_start_timezone = 1
                                    # Date/time has been found
                                    start_date_time_exists = True

                            # Start date/time is required
                            if start_date_time_exists:
                                dt_start = dt_start
                            else:
                                raise ValueError("One or more events don't have a DTSTART")
                            

                            # Assume that the event is invalid
                            end_date_time_exists = False
                            # Search every key
                            for key in current_event:
                                if "DTEND" in key:
                                    # The actual date/time of the event
                                    dt_end = current_event[key]
                                    # The name of the timezone e.g. TZID=Europe/London
                                    dt_end_timezone = 1
                                    # Date/time has been found
                                    end_date_time_exists = True

                            # End date/time is required
                            if end_date_time_exists:
                                dt_end = dt_end
                            else:
                                raise ValueError("One or more events don't have a DTEND")

                            
                            # UID will not be checked for because the DJango database will create an ID anyway for the event,
                            # it also serves no practical purpose for the user, essentially UID is only useful as a primary key
                            # for DB related queries etc, but the user will never see this value and it is purely used by DJango
                            
                            # A description is optional, no error for it not existing
                            if "DESCRIPTION" in current_event:
                                description = current_event["DESCRIPTION"]
                            else:
                                description = None
                            
                            # A location is optional, no error for it not existing
                            if "LOCATION" in current_event:
                                location = current_event["LOCATION"]
                            else:
                                location = None
                            
                            # A DTSTAMP is optional, no error for it not existing,
                            # But, the applicaiton will manually create one this is because a DTSTAMP is the
                            # "last edited" date/time of an event, importing events that don't have this detail
                            # will be assumed to have been last edited at time of uploading -> datetime.now()
                            if "DTSTAMP" in current_event:
                                dt_stamp = current_event["DTSTAMP"]
                            else:
                                
                                # Current date/time
                                current_date_time_unformatted = datetime.now()

                                # This is the format that is required by iCalendar
                                current_date_time = current_date_time_unformatted.strftime("%Y%m%dT%H%M%S")

                                dt_stamp = current_date_time
                            
                            # A location is optional, no error for it not existing
                            # This is because not all events repeat
                            # In the iCalendar format, if an event is a one time event, it will not have an RRule,
                            # If it does have this line, then it does repeat
                            # There are different types of repetitions, this will be managed during object creation
                            if "RRULE" in current_event:
                                r_rule = current_event["RRULE"]
                            else:
                                r_rule = None
                                print(r_rule)

                            # At this stage all the details about the event have been collected, and the required details,
                            # are definitely provided also

                            
                            # In order to not have duplicate events (this may occur if the user continously imports the same file),
                            # it needs to be checked if this event already exists,
                            # as event IDS, (UID) are useless for this due to them being managed by DJango,
                            # an event will be considered identical if it has the same name and occurs at the same exact time
                            # e.g. if the user has an event "Interview" from 12:00 to 12:30, and tries to import an event with these details,
                            # the event will not be added, however, this is not an error that causes the program to stop,
                            # as the user may be importing other events that are unqique, so it is necessary to check all events

                            # True / False, does this event already exist?
                            event_exists_pre_import = Event.objects.filter(
                                user=request.user,
                                title=summary,
                                start_time=dt_start,
                                end_time=dt_end,
                            ).exists()

                            # This means that the exact same event already exists in the DB, so there is no reason to import it again
                            if event_exists_pre_import:
                                testN = 1
                                print(testN)

                            # This event is a new event, so it will be added to the DB, this event will be added to the list
                            # This approach ensures that if the file is broken halfway through, there will not be a scenario where half
                            # of the events are imported but the other half are not
                            else:
                                # testN = 2
                                # The DB stores date/time using the DJango format, but iCalendar uses a different format so conversion is necessary
                                start_date_time_django_format = datetime.strptime(
                                    dt_start, "%Y%m%dT%H%M%S"
                                )
                                end_date_time_django_format = datetime.strptime(
                                    dt_end, "%Y%m%dT%H%M%S"
                                )

                                # To:Do --------------> support r_rule
                                new_event_to_import_data = [
                                    {
                                        "title": f"{summary}",
                                        "description": f"{description}",
                                        "location": f"{location}",
                                        "start_time": f"{start_date_time_django_format}",
                                        "end_time": f"{end_date_time_django_format}",
                                    }
                                ]

                                # This is the list of events to import at the very end, this current event is added to it
                                events.append(new_event_to_import_data)

                            """
                            response = {
                            "message": f"Import successful! {summary, dt_start, dt_end, description, location, r_rule, testN, event_exists_pre_import, a.location}",
                            "test": f"Hello {start_date_time_django_format}, aaaa {end_date_time_django_format}",
                            }
                            return Response(response)
                            """

                    # Every line that is not a begin or end event contains information about the event
                    # All these lines follow the format of "variable:detail", e.g. LOCATION:London
                    # This can be represented as key:value pairs in a dictionary
                    elif current_event is not None:
                        key, value = line.split(":")
                        current_event[key] = value

            # At this stage the file format is correct and all duplicate events have been ignored
            # All new events to import are in the events list
            events = events

            # Every event is added to the DB
            for e in events:
                for event in e:
                    Event.objects.create(
                        user=request.user,
                        title=event["title"],
                        description=event["description"],
                        location=event["location"],
                        start_time=event["start_time"],
                        end_time=event["end_time"],
                    )

            # Response letting the user know that the import was successful
            response = {
                "message": f"Import successful! Imported: {len(events)} event(s)."
            }
            return Response(response)

        # File format incorrect, error response
        except Exception as e:
            response = {"error": str(e)}
            return Response(response)
