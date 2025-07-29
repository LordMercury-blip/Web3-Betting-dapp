import React, { Fragment, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { Asset } from '../../types';
import { useAssets } from '../../hooks/useAssets';

interface AssetSelectProps {
  value: Asset | null;
  onChange: (asset: Asset | null) => void;
  className?: string;
  disabled?: boolean;
}

export default function AssetSelect({ value, onChange, className, disabled = false }: AssetSelectProps) {
  const [query, setQuery] = useState('');
  const { assets, loading, searchAssets } = useAssets();

  const filteredAssets = query === '' ? assets : searchAssets(query);

  return (
    <Combobox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-gray-800 border border-gray-700 text-left shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <Combobox.Input
            className={clsx(
              'w-full border-none bg-transparent py-2.5 pl-10 pr-10 text-white placeholder-gray-400',
              'focus:ring-0 focus:outline-none',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            displayValue={(asset: Asset) => asset ? `${asset.symbol} - ${asset.name}` : ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assets..."
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </Combobox.Button>
        </div>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-800 border border-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {loading ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-400">
                Loading assets...
              </div>
            ) : filteredAssets.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-400">
                No assets found.
              </div>
            ) : (
              filteredAssets.map((asset) => (
                <Combobox.Option
                  key={asset.id}
                  className={({ active }) =>
                    clsx(
                      'relative cursor-default select-none py-2 pl-3 pr-9',
                      active ? 'bg-blue-600 text-white' : 'text-gray-300'
                    )
                  }
                  value={asset}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                              {asset.symbol.slice(0, 2)}
                            </div>
                          </div>
                          <div>
                            <span className={clsx('block font-medium', selected ? 'font-semibold' : 'font-normal')}>
                              {asset.symbol}
                            </span>
                            <span className="block text-sm text-gray-400">{asset.name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">${asset.price.toLocaleString()}</div>
                          <div className={clsx(
                            'text-xs',
                            asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                          )}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>
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
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}