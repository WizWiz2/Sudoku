type RewardResult = 'reward' | 'closed';

type YandexSdk = {
    adv?: {
        showRewardedVideo: (opts: {
            callbacks?: {
                onOpen?: () => void;
                onRewarded?: () => void;
                onClose?: () => void;
                onError?: (err: unknown) => void;
            };
        }) => void;
    };
    environment?: {
        i18n?: {
            lang?: string;
        };
    };
    features?: {
        LoadingAPI?: {
            ready?: () => void;
        };
        GameReadyAPI?: {
            ready?: () => void;
        };
    };
};

type AdmobRewardVideo = {
    show: (options?: Record<string, unknown>) => Promise<void>;
};

declare global {
    interface Window {
        YaGames?: { init: () => Promise<YandexSdk> };
        ysdk?: YandexSdk;
        admob?: { rewardVideo?: AdmobRewardVideo };
    }
}

const adState: { initialized: boolean; yandex?: YandexSdk } = { initialized: false };

const storeSdk = (sdk?: YandexSdk) => {
    if (!sdk) {
        return;
    }
    adState.yandex = sdk;
    window.ysdk = sdk;
};

export const initAds = async (): Promise<void> => {
    if (adState.initialized) {
        return;
    }

    try {
        if (window.YaGames) {
            storeSdk(await window.YaGames.init());
        } else if (window.ysdk) {
            storeSdk(window.ysdk);
        }
    } catch (err) {
        console.warn('Yandex Ads init failed, fallback to stub', err);
    }

    adState.initialized = true;
};

export const getYandexSdk = (): YandexSdk | undefined => adState.yandex;

const showYandexRewarded = (): Promise<RewardResult> =>
    new Promise((resolve, reject) => {
        if (!adState.yandex?.adv?.showRewardedVideo) {
            resolve('closed');
            return;
        }

        adState.yandex.adv.showRewardedVideo({
            callbacks: {
                onRewarded: () => resolve('reward'),
                onClose: () => resolve('closed'),
                onError: (err) => reject(err),
            },
        });
    });

const showAdmobRewarded = (): Promise<RewardResult> => {
    const video = window.admob?.rewardVideo;
    if (!video) {
        return Promise.resolve('closed');
    }

    return video
        .show()
        .then(() => 'reward' as RewardResult)
        .catch((err: unknown) => {
            throw err;
        });
};

const simulateRewarded = (): Promise<RewardResult> =>
    new Promise((resolve) => {
        setTimeout(() => resolve('reward'), 1200);
    });

export const showRewardedAd = async (): Promise<RewardResult> => {
    if (adState.yandex?.adv?.showRewardedVideo) {
        return showYandexRewarded();
    }

    if (window.admob?.rewardVideo) {
        return showAdmobRewarded();
    }

    return simulateRewarded();
};
