import { useState } from "react";

interface PrivacySectionProps {
  deleting: boolean;
  onDeleteTasks: () => Promise<string>;
  onDeleteEvents: () => Promise<string>;
}


const PrivacySection = ({
  deleting,
  onDeleteTasks,
  onDeleteEvents,
}: PrivacySectionProps) => {
  const [message, setMessage] = useState<string | null>(null);
  
  return (

    <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Delete your user data in the application.
                  </p>

                    <div className="flex flex-col gap-3 w-48 h-40">
                        


                        <button onClick={() => {
                            console.log("Button test click")
                            onDeleteEvents().then((res) => {
                              console.log(res);
                              setMessage(res);
                            }).catch((error) => {
                              console.error(error);
                              setMessage("Failed to delete events");
                            });
                        }}
                        disabled={deleting}
                        className="px-3 py-3 rounded-lg text-lg flex items-center shadow-sm transition-colors">
                        <span className="material-icons mr-2 text-xl">delete_forever</span>
                        { deleting ? "Deleting": "Delete Events"}
                        </button>

                        <button
                        onClick={() => {
                            console.log("Button test click")
                            onDeleteTasks().then((res) => {
                              console.log(res);
                              setMessage(res);
                            }).catch((error) => {
                              console.error(error);
                              setMessage("Failed to delete tasks");
                            });
                        }}
                        disabled={deleting}
                        className="px-3 py-3 rounded-lg text-lg flex items-center shadow-sm transition-colors">
                        <span className="material-icons mr-2 text-xl">delete_forever</span>
                        { deleting ? "Deleting": "Delete Tasks"}
                        
                        </button>


                        {message && (
                          <div className="text-sm text-green-600 mt-2">
                        {message}
                        </div>

                        )}
                    </div>



                </div>
    </div>


  );
};






export default PrivacySection
