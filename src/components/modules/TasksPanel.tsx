import React, { useState } from 'react';
import { CheckSquare, Plus, Clock, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { TaskItem } from '../../types/assistant';
import { useSupabaseTasks } from '../../hooks/useSupabaseTasks';

export const TasksPanel: React.FC = () => {
  const { tasks, addTask, toggleTaskStatus, removeTask, isLoading } = useSupabaseTasks();

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskItem['category']>('CODING');
  const [newPriority, setNewPriority] = useState<TaskItem['priority']>('MEDIUM');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const task: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      status: 'PENDING',
      priority: newPriority,
      createdAt: 'Just now'
    };
    await addTask(task);
    setNewTitle('');
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-cyan-400" /> TASK & AUTOMATION MANAGER
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Track assistant background routines, coding tasks, and daily study schedules.
          </p>
        </div>
        {isLoading && (
          <span className="text-xs font-mono text-cyan-400">Loading...</span>
        )}
      </div>

      {/* Add Task */}
      <form onSubmit={handleAddTask} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-cyan-400" /> CREATE NEW TASK
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Task description..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="CODING">CODING</option>
            <option value="STUDY">STUDY</option>
            <option value="SYSTEM">SYSTEM</option>
            <option value="PERSONAL">PERSONAL</option>
          </select>
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="HIGH">HIGH PRIORITY</option>
            <option value="MEDIUM">MEDIUM PRIORITY</option>
            <option value="LOW">LOW PRIORITY</option>
          </select>
        </div>
        <button type="submit" className="btn-holographic text-xs py-1.5 px-4">
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </form>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all group ${
              task.status === 'COMPLETED'
                ? 'bg-slate-950/40 border-slate-800 opacity-60'
                : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/40'
            }`}
          >
            <div
              className="flex items-center gap-3 flex-1"
              onClick={() => toggleTaskStatus(task.id)}
            >
              {task.status === 'COMPLETED' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <Clock className="w-5 h-5 text-cyan-400" />
              )}
              <div>
                <h4 className={`text-xs font-semibold ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {task.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {task.category}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      task.priority === 'HIGH'
                        ? 'text-rose-400 bg-rose-950/40'
                        : task.priority === 'MEDIUM'
                        ? 'text-amber-400 bg-amber-950/40'
                        : 'text-slate-400 bg-slate-900'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">{task.createdAt}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTask(task.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
