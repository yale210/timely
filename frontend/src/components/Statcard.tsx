type StatcardProps = {
  title : string;
  value : string[];
}

/**
 *
 * @param root0
 * @param root0.title
 * @param root0.value
 */
export default function Statcard({title, value} : StatcardProps){
  const task_list = value.map(task =>
    <li key={value.indexOf(task)}>
      <input type="checkbox" value={value.indexOf(task)} />
      <label className="mt-2 text-md font-semibold text-gray-900" htmlFor={value.indexOf(task).toString()}> {task} </label><br />
    </li>
  )
  return(
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
      <section className="flex justify-between items-center pb-3 border-b border-gray-200">
        <p className="text-sm text-gray-500">{title}</p>
        <button className="text-blue-500 hover:underline">See More</button>
      </section>
      <section>
        <ul>
          {task_list}
        </ul>
      </section>
    </div>
  )
}
