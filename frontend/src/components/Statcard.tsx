import { Link } from "react-router-dom";


interface StatcardProps {
  title: string;
  value: string[];
  seeMoreHref?: string;
}

/**
 * Renders a stat card with a title and a checklist of values.
 * @param props - The properties for the Statcard component.
 * @param props.title - The heading displayed at the top of the card.
 * @param props.value - The list of items rendered as a checkbox list.
 * @param props.seeMoreHref - Optional link to view more details.
 */
export default function StatCard({ title, value, seeMoreHref = "/tasks" }: StatcardProps) {
  const taskList = value.map((task, index) => {
    const inputId = `${title.replace(/\s+/g, "-").toLowerCase()}-${index}`;
    return (
      <li key={inputId} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0">
        <input id={inputId} type="checkbox" className="mt-1" />
        <label className="text-sm font-medium text-gray-900 leading-6" htmlFor={inputId}>
          {task}
        </label>
      </li>
    );
  });
  return(
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
      <section className="flex justify-between items-center pb-3 border-b border-gray-200">
        <p className="text-sm text-gray-500">{title}</p>
        <Link to={seeMoreHref} className="text-blue-500 hover:underline">
          See More
        </Link>
      </section>
      <section>
        <ul className="mt-2">
          {taskList.length > 0 ? taskList : (
            <li className="py-2 text-sm text-gray-400">No tasks.</li>
          )}
        </ul>
      </section>
    </div>
  )
}
