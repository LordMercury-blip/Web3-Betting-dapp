import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

interface Option {
  label: string;
  value: any;
  category?: string;
}

interface SelectProps {
  value: any;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  groupByCategory?: boolean;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className,
  disabled = false,
  groupByCategory = false
}: SelectProps) {
  const selectedOption = options.find(option => option.value === value);

  const groupedOptions = groupByCategory
    ? options.reduce((acc, option) => {
        const category = option.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(option);
        return acc;
      }, {} as Record<string, Option[]>)
    : { '': options };

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Listbox.Button
          className={clsx(
            'relative w-full cursor-default rounded-lg bg-gray-800 border border-gray-700',
            'py-2.5 pl-3 pr-10 text-left text-white shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'hover:border-gray-600 transition-colors',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <span className="block truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-800 border border-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {Object.entries(groupedOptions).map(([category, categoryOptions]) => (
              <div key={category}>
                {category && groupByCategory && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
                    {category}
                  </div>
                )}
                {categoryOptions.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    className={({ active }) =>
                      clsx(
                        'relative cursor-default select-none py-2 pl-3 pr-9',
                        active ? 'bg-blue-600 text-white' : 'text-gray-300'
                      )
                    }
                    value={option.value}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={clsx('block truncate', selected ? 'font-medium' : 'font-normal')}>
                          {option.label}
                        </span>
                        {selected && (
                          <span
                            className={clsx(
                              'absolute inset-y-0 right-0 flex items-center pr-3',
                              active ? 'text-white' : 'text-blue-400'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </div>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}