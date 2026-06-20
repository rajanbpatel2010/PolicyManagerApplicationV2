import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats currency values with the Indian Rupee symbol.
 * Usage: {{ amount | inrCurrency }}
 */
@Pipe({ name: 'inrCurrency', standalone: true })
export class InrCurrencyPipe implements PipeTransform {
    transform(value: number | undefined | null): string {
        if (value === null || value === undefined) return '₹0';
        return '₹' + value.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }
}

/**
 * Returns a relative time string (e.g., "2 hours ago").
 * Usage: {{ dateString | timeAgo }}
 */
@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
    transform(value: string | Date | null | undefined): string {
        if (!value) return '';
        const date = new Date(value);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        const intervals: [number, string][] = [
            [31536000, 'year'],
            [2592000, 'month'],
            [86400, 'day'],
            [3600, 'hour'],
            [60, 'minute'],
            [1, 'second']
        ];

        for (const [secs, label] of intervals) {
            const count = Math.floor(seconds / secs);
            if (count >= 1) {
                return `${count} ${label}${count > 1 ? 's' : ''} ago`;
            }
        }

        return 'just now';
    }
}

/**
 * Truncates text to a specified length and adds ellipsis.
 * Usage: {{ text | truncateText:50 }}
 */
@Pipe({ name: 'truncateText', standalone: true })
export class TruncateTextPipe implements PipeTransform {
    transform(value: string | null | undefined, limit: number = 100): string {
        if (!value) return '';
        return value.length > limit ? value.substring(0, limit) + '...' : value;
    }
}
