const WEAPON_CLASS_ICON_URLS: Record<string, string> = {
  'great sword': 'https://static.wikia.nocookie.net/monsterhunter/images/c/c2/Great_Sword_Icon_White.png',
  'long sword': 'https://static.wikia.nocookie.net/monsterhunter/images/1/1e/Long_Sword_Icon_White.png',
  'dual blades': 'https://static.wikia.nocookie.net/monsterhunter/images/7/74/Dual_Blades_Icon_White.png',
  'insect glaive': 'https://static.wikia.nocookie.net/monsterhunter/images/4/47/Insect_Glaive_Icon_White.png',
  'charge blade': 'https://static.wikia.nocookie.net/monsterhunter/images/6/6c/Charge_Blade_Icon_White.png',
  'switch axe': 'https://static.wikia.nocookie.net/monsterhunter/images/4/40/Switch_Axe_Icon_White.png',
  'bow': 'https://static.wikia.nocookie.net/monsterhunter/images/a/a4/Bow_Icon_White.png',
  'hammer': 'https://static.wikia.nocookie.net/monsterhunter/images/9/99/Hammer_Icon_White.png',
  'hunting horn': 'https://static.wikia.nocookie.net/monsterhunter/images/4/46/Hunting_Horn_Icon_White.png',
  'lance': 'https://static.wikia.nocookie.net/monsterhunter/images/0/0b/Lance_Icon_White.png',
  'gun lance': 'https://static.wikia.nocookie.net/monsterhunter/images/1/17/Gunlance_Icon_White.png',
  'sword and shield': 'https://static.wikia.nocookie.net/monsterhunter/images/e/e5/Sword_and_Shield_Icon_White.png',
  'light bowgun': 'https://static.wikia.nocookie.net/monsterhunter/images/0/09/Light_Bowgun_Icon_White.png',
  'heavy bowgun': 'https://static.wikia.nocookie.net/monsterhunter/images/9/99/Heavy_Bowgun_Icon_White.png',
};

interface WeaponClassIconProps {
  weaponClass: string;
  className?: string;
}

export function WeaponClassIcon({ weaponClass, className = 'h-4 w-4' }: WeaponClassIconProps) {
  const src = WEAPON_CLASS_ICON_URLS[weaponClass.toLowerCase()];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
