import { Person, PersonSlug } from '../types';

interface FilterBarProps {
  people: Person[];
  selectedFilter: PersonSlug;
  onChange: (filter: PersonSlug) => void;
}

export function FilterBar({ people, selectedFilter, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar" aria-label="일정 필터">
      <button
        type="button"
        className={selectedFilter === 'all' ? 'filter-chip active all' : 'filter-chip all'}
        onClick={() => onChange('all')}
      >
        전체
      </button>

      {people.map((person) => (
        <button
          key={person.slug}
          type="button"
          className={selectedFilter === person.slug ? 'filter-chip active' : 'filter-chip'}
          onClick={() => onChange(person.slug)}
          style={
            selectedFilter === person.slug
              ? {
                  borderColor: person.color,
                  backgroundColor: `${person.color}1A`,
                  color: person.color
                }
              : undefined
          }
        >
          {person.name}
        </button>
      ))}
    </div>
  );
}

