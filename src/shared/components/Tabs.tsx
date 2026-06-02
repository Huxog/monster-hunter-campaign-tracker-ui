import { tv } from 'tailwind-variants';

const tabList = tv({
  base: 'flex border-b border-primary/20',
});

const tabTrigger = tv({
  base: 'px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none',
  variants: {
    active: {
      true: 'border-b-2 border-primary text-primary -mb-px',
      false: 'text-muted hover:text-cream',
    },
  },
  defaultVariants: { active: false },
});

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

export function Tabs({ tabs, activeTab, onTabChange, children }: TabsProps) {
  return (
    <div className="flex flex-col gap-0">
      <div className={tabList()} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            onClick={() => onTabChange(tab.id)}
            className={tabTrigger({ active: tab.id === activeTab })}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-4">
        {children}
      </div>
    </div>
  );
}
