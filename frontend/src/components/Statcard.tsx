type StatcardProps = {
  title : string;
  value : string[];
}

export default function Statcard({title, value} : StatcardProps){
  const task_list = value.map(task =>
    <li key={value.indexOf(task)}>
      <p className="mt-2 text-md font-semibold text-gray-900">{task}</p>
    </li>
  )
  return(
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
      <p className="text-sm text-gray-500 pb-3 border-b border-gray-200">{title}</p>
      <ul>
        {task_list}
      </ul>
    </div>
  )
}
