exports.MJ_TILE_NUMBER = 144;

exports.MJ_TILE_TYPE_INVALID = -1;
exports.MJ_TILE_TYPE_DOT = 0;
exports.MJ_TILE_DOT_1 = 0;
exports.MJ_TILE_DOT_2 = 1;
exports.MJ_TILE_DOT_3 = 2;
exports.MJ_TILE_DOT_4 = 3;
exports.MJ_TILE_DOT_5 = 4;
exports.MJ_TILE_DOT_6 = 5;
exports.MJ_TILE_DOT_7 = 6;
exports.MJ_TILE_DOT_8 = 7;
exports.MJ_TILE_DOT_9 = 8;
exports.MJ_TILE_TYPE_BAMBOO = 1;
exports.MJ_TILE_BAMBOO_1 = 9;
exports.MJ_TILE_BAMBOO_2 = 10;
exports.MJ_TILE_BAMBOO_3 = 11;
exports.MJ_TILE_BAMBOO_4 = 12;
exports.MJ_TILE_BAMBOO_5 = 13;
exports.MJ_TILE_BAMBOO_6 = 14;
exports.MJ_TILE_BAMBOO_7 = 15;
exports.MJ_TILE_BAMBOO_8 = 16;
exports.MJ_TILE_BAMBOO_9 = 17;
exports.MJ_TILE_TYPE_CHARACTER = 2;
exports.MJ_TILE_CHARACTER_1 = 18;
exports.MJ_TILE_CHARACTER_2 = 19;
exports.MJ_TILE_CHARACTER_3 = 20;
exports.MJ_TILE_CHARACTER_4 = 21;
exports.MJ_TILE_CHARACTER_5 = 22;
exports.MJ_TILE_CHARACTER_6 = 23;
exports.MJ_TILE_CHARACTER_7 = 24;
exports.MJ_TILE_CHARACTER_8 = 25;
exports.MJ_TILE_CHARACTER_9 = 26;
exports.MJ_TILE_TYPE_DRAGON_RED = 3;
exports.MJ_TILE_DRAGON_RED = 27;
exports.MJ_TILE_TYPE_DRAGON_GREEN = 4;
exports.MJ_TILE_DRAGON_GREEN = 28;
exports.MJ_TILE_TYPE_DRAGON_WHITE = 5;
exports.MJ_TILE_DRAGON_WHITE = 29;
exports.MJ_TILE_TYPE_WIND_EAST = 6;
exports.MJ_TILE_WIND_EAST = 30;
exports.MJ_TILE_TYPE_WIND_WEST = 7;
exports.MJ_TILE_WIND_WEST = 31;
exports.MJ_TILE_TYPE_WIND_SOUTH = 8;
exports.MJ_TILE_WIND_SOUTH = 32;
exports.MJ_TILE_TYPE_WIND_NORTH = 9;
exports.MJ_TILE_WIND_NORTH = 33;
exports.MJ_TILE_TYPE_SEASON_SPRING = 10;
exports.MJ_TILE_SEASON_SPRING = 34;
exports.MJ_TILE_TYPE_SEASON_SUMMER = 11;
exports.MJ_TILE_SEASON_SUMMER = 35;
exports.MJ_TILE_TYPE_SEASON_AUTUMN = 12;
exports.MJ_TILE_SEASON_AUTUMN = 36;
exports.MJ_TILE_TYPE_SEASON_WINTER = 13;
exports.MJ_TILE_SEASON_WINTER = 37;
exports.MJ_TILE_TYPE_FLOWER_PLUM = 14;
exports.MJ_TILE_FLOWER_PLUM = 38;
exports.MJ_TILE_TYPE_FLOWER_ORCHID = 15;
exports.MJ_TILE_FLOWER_ORCHID = 39;
exports.MJ_TILE_TYPE_FLOWER_BAMBOO = 16;
exports.MJ_TILE_FLOWER_BAMBOO = 40;
exports.MJ_TILE_TYPE_FLOWER_CHRYSANTHEMUM = 17;
exports.MJ_TILE_FLOWER_CHRYSANTHEMUM = 41;

exports.MJ_PLAYER_STATE_IDLE = "MJ_PLAYER_STATE_IDLE";
exports.MJ_PLAYER_STATE_PLAYING = "MJ_PLAYER_STATE_PLAYING";

exports.getTileType = function (a_Tile) {
	if (a_Tile >= MJ_TILE_DOT_1 && a_Tile <= MJ_TILE_DOT_9) {
		return MJ_TILE_TYPE_DOT;
	} else if (a_Tile >= MJ_TILE_BAMBOO_1 && a_Tile <= MJ_TILE_BAMBOO_9) {
		return MJ_TILE_TYPE_BAMBOO;
	} else if (a_Tile >= MJ_TILE_CHARACTER_1 && a_Tile <= MJ_TILE_CHARACTER_9) {
		return MJ_TILE_TYPE_CHARACTER;
	} else if (a_Tile == MJ_TILE_DRAGON_RED) {
		return MJ_TILE_TYPE_DRAGON_RED;
	} else if (a_Tile == MJ_TILE_DRAGON_GREEN) {
		return MJ_TILE_TYPE_DRAGON_GREEN;
	} else if (a_Tile == MJ_TILE_DRAGON_WHITE) {
		return MJ_TILE_TYPE_DRAGON_WHITE;
	} else if (a_Tile == MJ_TILE_WIND_EAST) {
		return MJ_TILE_TYPE_WIND_EAST;
	} else if (a_Tile == MJ_TILE_WIND_WEST) {
		return MJ_TILE_TYPE_WIND_WEST;
	} else if (a_Tile == MJ_TILE_WIND_SOUTH) {
		return MJ_TILE_TYPE_WIND_SOUTH;
	} else if (a_Tile == MJ_TILE_WIND_NORTH) {
		return MJ_TILE_TYPE_WIND_NORTH;
	} else if (a_Tile == MJ_TILE_SEASON_SPRING) {
		return MJ_TILE_TYPE_SEASON_SPRING;
	} else if (a_Tile == MJ_TILE_SEASON_SUMMER) {
		return MJ_TILE_TYPE_SEASON_SUMMER;
	} else if (a_Tile == MJ_TILE_SEASON_AUTUMN) {
		return MJ_TILE_TYPE_SEASON_AUTUMN;
	} else if (a_Tile == MJ_TILE_SEASON_WINTER) {
		return MJ_TILE_TYPE_SEASON_WINTER;
	} else if (a_Tile == MJ_TILE_FLOWER_PLUM) {
		return MJ_TILE_TYPE_FLOWER_PLUM;
	} else if (a_Tile == MJ_TILE_FLOWER_ORCHID) {
		return MJ_TILE_TYPE_FLOWER_ORCHID;
	} else if (a_Tile == MJ_TILE_FLOWER_BAMBOO) {
		return MJ_TILE_TYPE_FLOWER_BAMBOO;
	} else if (a_Tile == MJ_TILE_FLOWER_CHRYSANTHEMUM) {
		return MJ_TILE_TYPE_FLOWER_CHRYSANTHEMUM;
	} else {
		return -1;
	}
}

// module.exports = {
//     MJ_TILE_NUMBER: MJ_TILE_NUMBER
// };