export interface Paint {
	id: string;
	kind: "PAINT";
	name: string;
	users: string[];
	function: string;
	color: number | null;
	stops: Paint.Stop[];
	repeat: boolean;
	angle: number;
	shape?: string;
	image_url?: string;
	shadows: Paint.Shadow[];
}
export namespace Paint {
	export interface Stop {
		at: number;
		color: number;
		_alpha?: number;
	}

	export interface Shadow {
		x_offset: string;
		y_offset: string;
		radius: string;
		color: number;
	}
}

export interface Badge {
	id: string;
	kind: "BADGE";
	name: string;
	tooltip: string;
	tag: string;
	selected?: boolean;
}

export type Cosmetic = Paint | Badge;
