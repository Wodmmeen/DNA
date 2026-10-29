// blocks/index.js
import { HeroBlock } from './HeroBlock.js';
import { TextBlock } from './TextBlock.js';
import { ImageBlock } from './ImageBlock.js';
import { ButtonBlock } from './ButtonBlock.js';
import { ShapeBlock } from './ShapeBlock.js';
import { SliderBlock } from './SliderBlock.js';
import { VideoBlock } from './VideoBlock.js';
import { MapBlock } from './MapBlock.js';
import { GalleryBlock } from './GalleryBlock.js';
import { CounterBlock } from './CounterBlock.js';
import { AccordionBlock } from './AccordionBlock.js';
import { TabsBlock } from './TabsBlock.js';
import { ReviewsBlock } from './ReviewsBlock.js';
import { ProductBlock } from './ProductBlock.js';
import { ProgressBlock } from './ProgressBlock.js';
import { ContainerBlock } from './ContainerBlock.js';
import { RowBlock } from './RowBlock.js';

export const blockRegistry = {
    hero: HeroBlock,
    text: TextBlock,
    image: ImageBlock,
    button: ButtonBlock,
    shape: ShapeBlock,
    slider: SliderBlock,
    video: VideoBlock,
    map: MapBlock,
    gallery: GalleryBlock,
    counter: CounterBlock,
    accordion: AccordionBlock,
    tabs: TabsBlock,
    reviews: ReviewsBlock,
    product: ProductBlock,
    progress: ProgressBlock,
    container: ContainerBlock,
    row: RowBlock,
};

export const blockTypes = Object.keys(blockRegistry);

export const blockMetadata = {
    hero: { name: 'Герой', icon: 'fa-home', category: 'Стандартные' },
    text: { name: 'Текст', icon: 'fa-paragraph', category: 'Стандартные' },
    image: { name: 'Изображение', icon: 'fa-image', category: 'Медиа' },
    button: { name: 'Кнопка', icon: 'fa-hand-pointer', category: 'Стандартные' },
    shape: { name: 'Фигура', icon: 'fa-shapes', category: 'Фигуры' },
    slider: { name: 'Слайдер', icon: 'fa-images', category: 'Медиа' },
    video: { name: 'Видео', icon: 'fa-video', category: 'Медиа' },
    map: { name: 'Карта', icon: 'fa-map', category: 'Медиа' },
    gallery: { name: 'Галерея', icon: 'fa-th', category: 'Медиа' },
    counter: { name: 'Счётчик', icon: 'fa-calculator', category: 'Интерактив' },
    accordion: { name: 'Аккордеон', icon: 'fa-chevron-down', category: 'Интерактив' },
    tabs: { name: 'Табы', icon: 'fa-table', category: 'Интерактив' },
    reviews: { name: 'Отзывы', icon: 'fa-star', category: 'Интерактив' },
    product: { name: 'Товар', icon: 'fa-tag', category: 'Стандартные' },
    progress: { name: 'Прогресс', icon: 'fa-chart-line', category: 'Интерактив' },
    container: { name: 'Контейнер', icon: 'fa-layer-group', category: 'Контейнеры' },
    row: { name: 'Колонки', icon: 'fa-columns', category: 'Контейнеры' }
};