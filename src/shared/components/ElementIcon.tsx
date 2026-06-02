const ELEMENT_ICON_URLS: Record<string, string> = {
  fire: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/9/91/Element_Fire_Icon.png',
  water: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/3/31/Element_Water_Icon.png',
  thunder: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/0/07/Element_Thunder_Icon.png',
  ice: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/6/60/Element_Ice_Icon.png',
  dragon: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/e/ea/Element_Dragon_Icon.png',
  poison: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/5/5d/Status_Poison_Icon.png',
  paralysis: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/6/65/Status_Paralysis_Icon.png',
  sleep: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/6/65/Status_Sleep_Icon.png',
  stun: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/c/c1/Status_Stun_Icon.png',
  blast: 'https://static.wikia.nocookie.net/monsterhunterworld_gamepedia_en/images/5/5e/Status_Blastblight_Icon.png',
};

interface ElementIconProps {
  element: string;
  className?: string;
}

export function ElementIcon({ element, className = 'h-4 w-4' }: ElementIconProps) {
  const src = ELEMENT_ICON_URLS[element.toLowerCase()];
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
